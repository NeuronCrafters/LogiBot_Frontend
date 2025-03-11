import { FilterForms } from "./Forms/FilterForms";

interface Filters {
  university?: string;
  course?: string;
  discipline?: string;
  class?: string;
  professor?: string;
  student?: string;
}

interface FormsSectionFilterProps {
  fetchData: (filters: Filters) => void;
}

export function FormsSectionFilter({ fetchData }: FormsSectionFilterProps) {
  return (
    <div>
      <FilterForms fetchData={fetchData} />
    </div>
  );
}
