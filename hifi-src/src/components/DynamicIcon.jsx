import { DynamicIcon as LucideDynamicIcon } from 'lucide-react/dynamic';

// Lädt pro Icon-Name nur den einzelnen benötigten Icon-Chunk nach, statt die
// komplette ~2000-Icon-Bibliothek ins Bundle zu ziehen (siehe lucide-react/dynamic).
export default function DynamicIcon({ name, className = 'h-6 w-6', ...props }) {
  if (!name) return null;
  return <LucideDynamicIcon name={name} className={className} {...props} />;
}
