
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ActaData, MpcaData } from '@/types/acta';
import { generateFullMesaIdentifier } from '@/utils/mesaIdentifierUtils';

export const useActaSubmission = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitActa = async (actaData: ActaData, selectedMpcaRecord?: MpcaData | null): Promise<boolean> => {
    setIsSubmitting(true);
    console.log('📤 Submitting acta with mesa identifier...');
    
    try {
      // Generate full mesa identifier
      const mesaIdentifierFull = generateFullMesaIdentifier(selectedMpcaRecord, actaData.mesaIdentifier);

      // Submit electoral act (public access, no authentication required)
      const { data: actData, error: actError } = await supabase
        .from('electoral_acts')
        .insert({
          election_id: actaData.electionId,
          municipality_idm: parseInt(actaData.municipio),
          mesa_identifier: actaData.mesaIdentifier,
          mesa_identifier_full: mesaIdentifierFull,
          census_total: parseInt(actaData.censo),
          total_voters: parseInt(actaData.votantes),
          blank_votes: parseInt(actaData.blancos),
          null_votes: parseInt(actaData.nulos),
          source_type: 'user',
          image_url: actaData.imageUrl,
          observations: actaData.observations || null,
          submitted_by: null // No user authentication required
        })
        .select()
        .single();

      if (actError) {
        console.error('❌ Error submitting electoral act:', actError);
        throw actError;
      }

      console.log('✅ Electoral act submitted successfully:', actData.id);

      // Submit party votes if any
      const partyVotesData = Object.entries(actaData.votos)
        .filter(([_, votes]) => votes && parseInt(votes) > 0)
        .map(([partyId, votes]) => ({
          electoral_act_id: actData.id,
          party_id: partyId,
          votes: parseInt(votes)
        }));

      if (partyVotesData.length > 0) {
        const { error: votesError } = await supabase
          .from('party_votes')
          .insert(partyVotesData);

        if (votesError) {
          console.error('❌ Error submitting party votes:', votesError);
          throw votesError;
        }
        console.log(`✅ ${partyVotesData.length} party votes submitted successfully`);
      }

      // Submit mail voters if any (only DNI now)
      if (actaData.mailVoters && actaData.mailVoters.length > 0) {
        const mailVotersData = actaData.mailVoters
          .filter(voter => voter.dni.trim())
          .map(voter => ({
            electoral_act_id: actData.id,
            dni: voter.dni.trim()
          }));

        if (mailVotersData.length > 0) {
          const { error: mailVotersError } = await supabase
            .from('mail_votes')
            .insert(mailVotersData);

          if (mailVotersError) {
            console.error('❌ Error submitting mail voters:', mailVotersError);
            throw mailVotersError;
          }
          console.log(`✅ ${mailVotersData.length} mail voters submitted successfully`);
        }
      }

      toast({
        title: "Acta enviada correctamente",
        description: "El acta electoral ha sido registrada en el sistema.",
      });

      return true;

    } catch (error) {
      console.error('💥 Error submitting act:', error);
      toast({
        variant: "destructive",
        title: "Error al enviar el acta",
        description: "No se pudo enviar el acta. Por favor, inténtalo de nuevo.",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitActa
  };
};
