import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const numberValue = (value) => value === '' ? null : Number(value);

export default function FinancialCompositionEditor({ items = [], onChange, disabled }) {
  const updateItem = (index, field, value) => {
    onChange(items.map((item, currentIndex) => currentIndex === index ? { ...item, [field]: value } : item));
  };

  const addItem = () => {
    onChange([
      ...items,
      {
        item_key: `custom_${Date.now()}`,
        label: 'Novo item',
        category: 'OUTROS',
        amount: null,
        percentage: null,
        include_in_total: true,
        sort_order: items.length,
        notes: '',
      },
    ]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="font-semibold text-slate-800">Composição do faturamento</Label>
          <p className="text-xs text-slate-500">Detalhamento flexível dos valores da TAO.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addItem} disabled={disabled}>
          <Plus className="w-4 h-4 mr-2" /> Item
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Item</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="w-36">Valor (R$)</TableHead>
              <TableHead className="w-28">Percentual</TableHead>
              <TableHead className="w-24">Total</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.item_key}>
                <TableCell><Input value={item.label || ''} onChange={(event) => updateItem(index, 'label', event.target.value)} disabled={disabled} /></TableCell>
                <TableCell><Input value={item.category || ''} onChange={(event) => updateItem(index, 'category', event.target.value)} disabled={disabled} /></TableCell>
                <TableCell><Input type="number" step="0.01" value={item.amount ?? ''} onChange={(event) => updateItem(index, 'amount', numberValue(event.target.value))} disabled={disabled} /></TableCell>
                <TableCell><Input type="number" step="0.01" value={item.percentage ?? ''} onChange={(event) => updateItem(index, 'percentage', numberValue(event.target.value))} disabled={disabled} /></TableCell>
                <TableCell className="text-center"><Checkbox checked={item.include_in_total !== false} onCheckedChange={(value) => updateItem(index, 'include_in_total', Boolean(value))} disabled={disabled} /></TableCell>
                <TableCell><Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))} disabled={disabled}><Trash2 className="w-4 h-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
