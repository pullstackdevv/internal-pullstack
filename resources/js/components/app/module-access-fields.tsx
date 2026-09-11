import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface ModuleAccessEntry {
    module: 'docs' | 'invoice';
    level: 'view' | 'manage';
}

const MODULES: Array<{ key: ModuleAccessEntry['module']; label: string }> = [
    { key: 'docs', label: 'Dokumentasi' },
    { key: 'invoice', label: 'Invoice' },
];

interface Props {
    value: ModuleAccessEntry[];
    onChange: (value: ModuleAccessEntry[]) => void;
}

export function ModuleAccessFields({ value, onChange }: Props) {
    function toggle(moduleKey: ModuleAccessEntry['module'], checked: boolean) {
        if (checked) {
            onChange([...value, { module: moduleKey, level: 'view' }]);
        } else {
            onChange(value.filter((entry) => entry.module !== moduleKey));
        }
    }

    function setLevel(moduleKey: ModuleAccessEntry['module'], level: ModuleAccessEntry['level']) {
        onChange(value.map((entry) => (entry.module === moduleKey ? { ...entry, level } : entry)));
    }

    return (
        <div className="space-y-3">
            <Label>Akses Modul</Label>
            {MODULES.map(({ key, label }) => {
                const entry = value.find((e) => e.module === key);

                return (
                    <div key={key} className="flex items-center gap-3">
                        <Checkbox
                            checked={!!entry}
                            onCheckedChange={(checked) => toggle(key, checked === true)}
                        />
                        <span className="w-32 text-sm">{label}</span>
                        {entry && (
                            <Select value={entry.level} onValueChange={(v) => setLevel(key, v as ModuleAccessEntry['level'])}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="view">View</SelectItem>
                                    <SelectItem value="manage">Manage</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
