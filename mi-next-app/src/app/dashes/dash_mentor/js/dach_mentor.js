// DACH MENTOR UTILITIES

/**
 * Valida los datos del formulario de materias
 */
export const validateSubjectForm = (formData) => {
  const { name, teacher, semester, group } = formData;
  
  if (!name || !name.trim()) {
    return { valid: false, message: "Subject name is required" };
  }
  
  if (!teacher || !teacher.trim()) {
    return { valid: false, message: "Teacher name is required" };
  }
  
  if (!semester || !semester.trim()) {
    return { valid: false, message: "Semester is required" };
  }
  
  if (!group || !group.trim()) {
    return { valid: false, message: "Group is required" };
  }
  
  return { valid: true, message: "Form is valid" };
};

/**
 * Exporta los datos de las materias a JSON
 */
export const exportSubjectsToJSON = (subjects) => {
  const dataStr = JSON.stringify(subjects, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `subjects_${new Date().getTime()}.json`;
  link.click();
};

/**
 * Importa datos de materias desde JSON
 */
export const importSubjectsFromJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        resolve(data);
      } catch (error) {
        reject(new Error("Invalid JSON file"));
      }
    };
    reader.onerror = () => reject(new Error("Error reading file"));
    reader.readAsText(file);
  });
};

/**
 * Filtra materias por semestre
 */
export const filterSubjectsBySemester = (subjects, semester) => {
  return subjects.filter((subject) => subject.semester === semester);
};

/**
 * Filtra materias por maestro
 */
export const filterSubjectsByTeacher = (subjects, teacher) => {
  return subjects.filter((subject) =>
    subject.teacher.toLowerCase().includes(teacher.toLowerCase())
  );
};

/**
 * Ordena materias alfabéticamente
 */
export const sortSubjectsAlphabetically = (subjects) => {
  return [...subjects].sort((a, b) => a.name.localeCompare(b.name));
};
