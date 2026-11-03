import { useEffect, useState } from "react";
import { getCourseOptions } from "../api/courseApi";

export default function useCourseOptions() {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    getCourseOptions()
      .then((res) => {
        if (!ignore) setCourses(res.data);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return { courses, error };
}
