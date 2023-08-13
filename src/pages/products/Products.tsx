import "./products.scss"
// import 
import  DataTable  from "../../components/dataTable/DataTable"
// import { GridValueGetterParams } from '@mui/x-data-grid';
import { useState } from "react";
import Add from "../../components/add/Add";
import { products } from "../../data";
import { GridColDef } from "@mui/x-data-grid";

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
    width: 10,
    type: "boolean",
  },
];


const Products=()=> {
  const [open,setOpen] = useState(false);
  return (
    <div className="products">
      <div className="info">
        <h1>Products</h1>
        <button onClick={()=>setOpen(true)}>Add new products</button>
      </div>
      <DataTable slug="products" columns={columns} rows={products}/>
      {open && <Add slug = "product" columns={columns}setOpen={setOpen}/>}
    </div>
)
}

export default Products