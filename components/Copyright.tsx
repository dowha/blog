import { useState, useEffect } from "react";

export default function Copyright() {
  const [year, setYear] = useState(() => new Date().getFullYear());

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <p className="copyright text-left text-xs text-gray-500 mt-0 pl-0 pb-2 mobile:pl-0 sm:pl-10 md:pl-14">
      © 2017-{year} <a href="https://dowha.kim" target="_blank">Dowha Kim</a>. Non-commercial use only.
    </p>
  );
}
