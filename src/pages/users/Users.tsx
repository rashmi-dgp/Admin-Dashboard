import "./users.scss"
import DataTable  from "../../components/dataTable/DataTable"
// import { GridValueGetterParams } from '@mui/x-data-grid';
import { useState } from "react";
import Add from "../../components/add/Add";
import {
    // DataGrid,
    GridColDef,
    // GridToolbar,
  } from "@mui/x-data-grid";
import { userRows } from "../../data";
import { useQuery } from "@tanstack/react-query";
// import {Add}
const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 90 },
  {
    field: "img",
    headerName: "Avatar",
    width: 50,
    renderCell: (params) => {
      return <img src={params.row.img || "/noavatar.png"} alt="" />;
    },
  },
  {
    field: "firstName",
    type: "string",
    headerName: "First name",
    width: 100,
  },
  {
    field: "lastName",
    type: "string",
    headerName: "Last name",
    width: 100,
  },
  {
    field: "email",
    type: "string",
    headerName: "Email",
    width: 150,
  },
  {
    field: "phone",
    type: "string",
    headerName: "Phone",
    width: 150,
  },
  {
    field: "createdAt",
    headerName: "Created At",
    width: 150,
    type: "string",
  },
  {
    field: "verified",
    headerName: "Verified",
    width: 100,
    type: "boolean",
  },
];



const Users=()=> {
  const [open,setOpen] = useState(false);

  const { isLoading, data } = useQuery({
    queryKey: ["allusers"],
    queryFn: () =>
      fetch("http://localhost:8800/api/users").then(
        (res) => res.json()
      ),
  });


  return (
    <div className="users">
      <div className="info">
        <h1>Users</h1>
        <button onClick={()=>setOpen(true)}>Add new user</button>
      </div>
      <DataTable slug="users" columns={columns} rows={userRows}/>

      {isLoading ? (
        "Loading..."
      ) : (
        <DataTable slug="users" columns={columns} rows={data} />
      )}


      {open && <Add slug = "user" columns={columns}setOpen={setOpen}/>}
    </div>
  )
}

export default Users