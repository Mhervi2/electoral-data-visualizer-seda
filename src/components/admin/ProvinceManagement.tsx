import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePartyProvinces } from '@/hooks/usePartyProvinces';
import { useAppData } from '@/hooks/useAppData';
import { CheckCircle2 } from 'lucide-react';

interface ProvinceManagementProps {
  partyId: string;
}

interface ProvincesByCommunity {
  [communityName: string]: string[];
}

export const ProvinceManagement: React.FC<ProvinceManagementProps> = ({ partyId }) => {
  const { mpcaData } = useAppData();
  const { getPartyAvailability, updatePartyProvince, setPartyForAllProvinces, loading, updating } = usePartyProvinces(partyId);
  const [provincesByCommunity, setProvincesByCommunity] = useState<ProvincesByCommunity>({});

  useEffect(() => {
    if (mpcaData) {
      // Group provinces by autonomous community
      const grouped: ProvincesByCommunity = {};
      
      mpcaData.forEach(item => {
        if (item.ca && item.provincia) {
          if (!grouped[item.ca]) {
            grouped[item.ca] = [];
          }
          if (!grouped[item.ca].includes(item.provincia)) {
            grouped[item.ca].push(item.provincia);
          }
        }
      });

      // Sort communities and provinces
      Object.keys(grouped).forEach(ca => {
        grouped[ca].sort();
      });

      setProvincesByCommunity(grouped);
    }
  }, [mpcaData]);

  const handleProvinceToggle = async (provincia: string, isAvailable: boolean) => {
    await updatePartyProvince(partyId, provincia, isAvailable);
  };

  const handleSelectAllProvinces = async () => {
    const allProvinces = Object.values(provincesByCommunity).flat();
    await setPartyForAllProvinces(partyId, allProvinces, true);
  };

  const handleSelectCommunity = async (communityName: string) => {
    const communityProvinces = provincesByCommunity[communityName];
    await setPartyForAllProvinces(partyId, communityProvinces, true);
  };

  const getAllProvinces = () => Object.values(provincesByCommunity).flat();
  const getSelectedCount = () => {
    return getAllProvinces().filter(provincia => 
      getPartyAvailability(partyId, provincia)
    ).length;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Disponibilidad por Provincia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Cargando configuración de provincias...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Disponibilidad por Provincia</span>
          <div className="text-sm text-muted-foreground">
            {getSelectedCount()} / {getAllProvinces().length} provincias seleccionadas
          </div>
        </CardTitle>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSelectAllProvinces}
            disabled={updating}
            className="flex items-center gap-1"
          >
            <CheckCircle2 className="h-3 w-3" />
            Todas las Provincias
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(provincesByCommunity)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([communityName, provinces]) => (
            <div key={communityName} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">
                  {communityName}
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSelectCommunity(communityName)}
                  disabled={updating}
                  className="text-xs"
                >
                  Seleccionar toda la CA
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {provinces.map(provincia => {
                  const isAvailable = getPartyAvailability(partyId, provincia);
                  return (
                    <div
                      key={provincia}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                    >
                      <Label
                        htmlFor={`provincia-${provincia}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {provincia}
                      </Label>
                      <Switch
                        id={`provincia-${provincia}`}
                        checked={isAvailable}
                        onCheckedChange={(checked) => 
                          handleProvinceToggle(provincia, checked)
                        }
                        disabled={updating}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  );
};