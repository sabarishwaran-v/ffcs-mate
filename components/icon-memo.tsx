import { Check, Edit, Pencil, Plus, Search, Trash } from "lucide-react";
import { memo } from "react";

export const AddIcon = memo(() => <Plus className="w-4 h-4" />);
AddIcon.displayName = "AddIcon";

export const CheckIcon = memo(() => <Check className="w-4 h-4" />);
CheckIcon.displayName = "CheckIcon";

export const EditIcon = memo(() => <Pencil className="w-4 h-4" />);
EditIcon.displayName = "EditIcon";

export const Edit2Icon = memo(() => <Edit className="w-4 h-4" />);
Edit2Icon.displayName = "Edit2Icon";

export const SearchIcon = memo(() => (
  <Search className="absolute w-4 h-4 transform -translate-y-1/2 left-2 top-1/2 text-muted-foreground" />
));
SearchIcon.displayName = "SearchIcon";

export const TrashIcon = memo(() => <Trash className="w-4 h-4" />);
TrashIcon.displayName = "TrashIcon";
