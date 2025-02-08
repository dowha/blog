import { useState, useEffect } from "react";

export default function Copyright() {
  const [year, setYear] = useState(() => new Date().getFullYear());

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <p className="text-left text-xs text-gray-500 pl-14 mt-0">
      © 2017-{year} Dowha Kim. Non-commercial use only.
    </p>
  );
}
