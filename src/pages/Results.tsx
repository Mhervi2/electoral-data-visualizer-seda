
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';

// Mock data
const mockProvinces = [
  { id: '28', name: 'Madrid' },
  { id: '08', name: 'Barcelona' },
  { id: '41', name: 'Sevilla' },
  { id: '46', name: 'Valencia' },
];

const mockMunicipalities = {
  '28': [{ id: '28079', name: 'Madrid' }, { id: '28080', name: 'Alcalá de Henares' }],
  '08': [{ id: '08019', name: 'Barcelona' }, { id: '08020', name: 'Badalona' }],
};

const mockPartyData = [
  { name: 'PSOE', votes: 6700000, seats: 123, color: '#E53E3E' },
  { name: 'PP', votes: 5000000, seats: 89, color: '#3182CE' },
  { name: 'Podemos', votes: 3100000, seats: 35, color: '#805AD5' },
  { name: 'Vox', votes: 3600000, seats: 52, color: '#38A169' },
  { name: 'ERC', votes: 870000, seats: 13, color: '#D69E2E' },
];

const Results = () => {
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('');
  const [selectedSources, setSelectedSources] = useState<string[]>(['user']);

  const dataSources = [
    { id: 'user', label: 'Actas de Usuario' },
    { id: 'indra', label: 'Datos INDRA' },
    { id: 'escrutinio', label: 'Escrutinio General' },
    { id: 'oficial', label: 'Resultado Oficial' },
  ];

  const handleSourceChange = (sourceId: string, checked: boolean) => {
    if (checked) {
      setSelectedSources([...selectedSources, sourceId]);
    } else {
      setSelectedSources(selectedSources.filter(id => id !== sourceId));
    }
  };

  const getTitle = () => {
    if (selectedMunicipality) {
      const municipality = mockMunicipalities[selectedProvince as keyof typeof mockMunicipalities]?.find(m => m.id === selectedMunicipality);
      return `Resultados - ${municipality?.name}`;
    }
    if (selectedProvince) {
      const province = mockProvinces.find(p => p.id === selectedProvince);
      return `Resultados - ${province?.name}`;
    }
    return 'Resultados Electorales - Nacional';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground font-space-grotesk">
          Resultados Electorales
        </h1>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar Datos
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Provincia</label>
              <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar provincia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las provincias</SelectItem>
                  {mockProvinces.map(province => (
                    <SelectItem key={province.id} value={province.id}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Municipio</label>
              <Select 
                value={selectedMunicipality} 
                onValueChange={setSelectedMunicipality}
                disabled={!selectedProvince}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar municipio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los municipios</SelectItem>
                  {selectedProvince && mockMunicipalities[selectedProvince as keyof typeof mockMunicipalities]?.map(municipality => (
                    <SelectItem key={municipality.id} value={municipality.id}>
                      {municipality.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">Fuentes de Datos</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dataSources.map(source => (
                <div key={source.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={source.id}
                    checked={selectedSources.includes(source.id)}
                    onCheckedChange={(checked) => handleSourceChange(source.id, !!checked)}
                  />
                  <label htmlFor={source.id} className="text-sm">
                    {source.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen y Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{getTitle()}</CardTitle>
            <CardDescription>Distribución de Votos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockPartyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => value.toLocaleString()} />
                <Legend />
                <Bar dataKey="votes" fill="#A80000" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución de Escaños</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockPartyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, seats }) => `${name}: ${seats}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="seats"
                >
                  {mockPartyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabla Detallada */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados Detallados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Partido</th>
                  {selectedSources.includes('user') && <th className="text-right p-2">Votos Usuario</th>}
                  {selectedSources.includes('indra') && <th className="text-right p-2">Votos INDRA</th>}
                  {selectedSources.includes('escrutinio') && <th className="text-right p-2">Escrutinio</th>}
                  {selectedSources.includes('oficial') && <th className="text-right p-2">Oficial</th>}
                  <th className="text-right p-2">Escaños</th>
                </tr>
              </thead>
              <tbody>
                {mockPartyData.map((party, index) => (
                  <tr key={index} className="border-b hover:bg-accent/20">
                    <td className="p-2 font-medium">{party.name}</td>
                    {selectedSources.includes('user') && <td className="text-right p-2">{party.votes.toLocaleString()}</td>}
                    {selectedSources.includes('indra') && <td className="text-right p-2">{(party.votes * 0.98).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</td>}
                    {selectedSources.includes('escrutinio') && <td className="text-right p-2">{(party.votes * 1.02).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</td>}
                    {selectedSources.includes('oficial') && <td className="text-right p-2">{party.votes.toLocaleString()}</td>}
                    <td className="text-right p-2 font-bold">{party.seats}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Results;
