import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const numberValue = (value) => value === '' ? null : Number(value);

export default function IndirectExpensesEditor({ items = [], onChange, disabled }) {
  const updateItem = (index, field, value) => {
    onChange(items.map((item, currentIndex) => currentIndex === index ? { ...item, [field]: value } : item));
  };

  const addItem = () => {
    onChange([...items, {
      item_key: `custom_${Date.now()}`,
      label: 'Nova despesa',
      monthly_value: null,
      total_period: null,
      person_name: '',
      sort_order: items.length,
      notes: '',
    }]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="font-semibold text-slate-800">Despesas indiretas e equipe-base</Label>
          <p className="text-xs text-slate-500">Valor mensal, total do período e profissional previsto.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addItem} disabled={disabled}>
          <Plus className="w-4 h-4 mr-2" /> Despesa
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Despesa</TableHead>
              <TableHead>Profissional</TableHead>
              <TableHead className="w-40">Valor mensal</TableHead>
              <TableHead className="w-40">Total do período</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.item_key}>
                <TableCell><Input value={item.label || ''} onChange={(event) => updateItem(index, 'label', event.target.value)} disabled={disabled} /></TableCell>
                <TableCell><Input value={item.person_name || ''} onChange={(event) => updateItem(index, 'person_name', event.target.value)} disabled={disabled} /></TableCell>
                <TableCell><Input type="number" step="0.01" value={item.monthly_value ?? ''} onChange={(event) => updateItem(index, 'monthly_value', numberValue(event.target.value))} disabled={disabled} /></TableCell>
                <TableCell><Input type="number" step="0.01" value={item.total_period ?? ''} onChange={(event) => updateItem(index, 'total_period', numberValue(event.target.value))} disabled={disabled} /></TableCell>
                <TableCell><Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))} disabled={disabled}><Trash2 className="w-4 h-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
