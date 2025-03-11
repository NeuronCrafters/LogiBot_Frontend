import { FilterForms } from "./Forms/FilterForms";

interface Filters {
  university?: string;
  course?: string;
  class?: string;
}

interface FormsSectionFilterProps {
  fetchData: (data: any) => void;
}

export function FormsSectionFilter({ fetchData }: FormsSectionFilterProps) {
  const handleFetchData = async (filters: Filters) => {
    fetchData(filters);
  };

  return (
    <div>
      <FilterForms fetchData={handleFetchData} />
    </div>
  );
}
