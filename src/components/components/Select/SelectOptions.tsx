import React from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Typograph } from "@/components/components/Typograph/Typograph";

interface University {
  _id: string;
  name: string;
}

interface SelectOptionsProps {
  universities: University[];
  selectedUniversity: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function SelectOptions({
  universities,
  selectedUniversity,
  onChange,
  placeholder = "Selecione a universidade",
  className,
}: SelectOptionsProps) {
  return (
    <Select value={selectedUniversity} onValueChange={onChange}>
      <SelectTrigger className={`bg-neutral-800 text-white w-full ${className}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-neutral-800 text-white">
        {universities.map((univ) => (
          <SelectItem key={univ._id} value={univ._id}>
            <Typograph
              text={univ.name}
              colorText="text-white"
              variant="text4"
              weight="medium"
              fontFamily="poppins"
            />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { SelectOptions };
