import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PoliticalParty } from '@/types/acta';

interface SortablePartyItemProps {
  party: PoliticalParty;
  votes: string;
  onVoteChange: (partyId: string, votes: string) => void;
}

const SortablePartyItem = ({ party, votes, onVoteChange }: SortablePartyItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: party.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-4 p-3 border rounded-lg bg-background ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      
      <div 
        className="w-4 h-4 rounded-full flex-shrink-0" 
        style={{ backgroundColor: party.color || '#6B7280' }}
        title={`Color del partido: ${party.color || '#6B7280'}`}
      />
      
      <div className="w-20 text-sm font-medium">{party.siglas}</div>
      
      <div className="flex-1 text-sm">{party.name}</div>
      
      <Input
        type="number"
        value={votes}
        onChange={(e) => onVoteChange(party.id, e.target.value)}
        className="w-24"
        placeholder="0"
        min="0"
      />
    </div>
  );
};

interface DraggablePartyListProps {
  parties: PoliticalParty[];
  votos: { [key: string]: string };
  onVoteChange: (partidoId: string, votes: string) => void;
  onPartyOrderChange: (newOrder: PoliticalParty[]) => void;
  provincia?: string;
}

export const DraggablePartyList = ({ 
  parties, 
  votos, 
  onVoteChange, 
  onPartyOrderChange,
  provincia 
}: DraggablePartyListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parties.findIndex(party => party.id === active.id);
      const newIndex = parties.findIndex(party => party.id === over.id);
      
      const newOrder = arrayMove(parties, oldIndex, newIndex);
      onPartyOrderChange(newOrder);
    }
  };

  if (!parties || parties.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay partidos políticos disponibles. Cargando...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {provincia && (
        <div className="text-sm text-muted-foreground mb-4">
          Orden de partidos para <span className="font-medium">{provincia}</span>. 
          Arrastra para reordenar.
        </div>
      )}
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={parties.map(party => party.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {parties.map(party => (
              <SortablePartyItem
                key={party.id}
                party={party}
                votes={votos[party.id] || ''}
                onVoteChange={onVoteChange}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};