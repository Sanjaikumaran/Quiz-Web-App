import "../styles/Students.css";

import components from "./components";
const { DataTableManagement } = components;

const Students = () => {
  return (
    <>
      <DataTableManagement
        tablePageName={"Students"}
        collectionName={"Users"}
      />
    </>
  );
};

export default Students;
