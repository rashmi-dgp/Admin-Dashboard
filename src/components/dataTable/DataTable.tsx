import "./dataTable.scss"
import Box from '@mui/material/Box';
import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { GridValueGetterParams } from '@mui/x-data-grid';
import {
    DataGrid,
    GridColDef,
    GridToolbar,
  } from "@mui/x-data-grid";
import { Link } from "react-router-dom";
  
type Props = {
    columns: GridColDef[];
    rows   : object[];
    slug   : string;
}


 const DataTable = (props:Props) => {

    const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: number) => {
      return fetch(`http://localhost:8800/api/${props.slug}/${id}`, {
        method: "delete",
      });
    },
    onSuccess: ()=>{
      queryClient.invalidateQueries([`all${props.slug}`]);
    }
  });


  const handleDelete = (id: number) => {
    //delete the item
    mutation.mutate(id)
  };




  const actionColumn:GridColDef={
    field:"action",
    headerName:"Action",
    width:200,
    renderCell:(params)=>{
        return(
            <div className="action">
                <Link to ={`/${props.slug}/${params.row.id}`}>
                <img src="/view.svg" alt="" />
                </Link>
                <div className="delete" onClick={()=>handleDelete(params.row.id)}>
                    <img src="/delete.svg" alt="" />
                </div>
            </div>
        )
    }
  }

  return (
    <div className="dataTable">
            <Box sx={{ height: 400, width: '100%' }}>
      <DataGrid
      className="dataGrid"
        rows={props.rows}
        columns={[...props.columns, actionColumn]}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 4,
            },
          },
        }}
        slots={{toolbar:GridToolbar}}
        slotProps={{
            toolbar:{
                showQuickFilter:true,
                quickFilterProps: {debounceMs:500},
            }
        }}
        pageSizeOptions={[5]}
        checkboxSelection
        disableRowSelectionOnClick
        disableColumnFilter
        disableColumnSelector
        disableDensitySelector
      />
    </Box>

    </div>
  )
}
export default DataTable;
