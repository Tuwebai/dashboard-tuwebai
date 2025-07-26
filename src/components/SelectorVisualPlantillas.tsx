import React from 'react';
import { templates } from '@/pages/visual-templates';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { motion } from 'framer-motion';

interface SelectorVisualPlantillasProps {
  onSelect: (templateId: string) => void;
  selectedId?: string;
}

const SelectorVisualPlantillas: React.FC<SelectorVisualPlantillasProps> = ({ onSelect, selectedId }) => {
  return (
    <div className="w-full flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-white mb-2">Elige una plantilla prediseñada</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl) => (
          <motion.div
            key={tpl.id}
            whileHover={{ scale: 1.03 }}
            className={`relative group ${selectedId === tpl.id ? 'ring-4 ring-purple-500' : ''}`}
          >
            <Card className="bg-gradient-to-br from-[#0f172a] to-[#312e81] border-none shadow-xl flex flex-col h-full">
              <div className="aspect-video w-full rounded-t-xl overflow-hidden flex items-center justify-center bg-[#18181b]">
                <img
                  src={tpl.preview}
                  alt={tpl.name}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{tpl.name}</h3>
                  <p className="text-sm text-slate-300 mb-2">{tpl.description}</p>
                </div>
                <Button
                  variant={selectedId === tpl.id ? 'default' : 'outline'}
                  className={`w-full mt-2 font-bold ${selectedId === tpl.id ? 'bg-purple-600 text-white' : 'border-blue-500 text-blue-400 hover:bg-blue-950'}`}
                  onClick={() => onSelect(tpl.id)}
                >
                  {selectedId === tpl.id ? 'Seleccionada' : 'Seleccionar'}
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SelectorVisualPlantillas; 