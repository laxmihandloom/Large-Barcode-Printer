import React from 'react';
import Box from '@mui/material/Box';
import { DataGrid, GridColDef, GridPaginationMeta, GridRenderCellParams, useGridApiRef } from '@mui/x-data-grid';
import { Typography } from '@mui/material';

const columns: GridColDef[] = [
    {
        field: 'name',
        headerName: 'Name',
        width: 150,
        renderCell: (params: GridRenderCellParams<any, string>) => {
            if (params.value) {
                return (
                    <Typography color='primary' component='h6' noWrap>{params.value}</Typography>
                );
            }
        },
    },
    {
        field: 'sku',
        headerName: 'SKU',
        width: 90,
    },
    {
        field: 'description',
        headerName: 'Description',
        width: 100,
        sortable: false

    },
    {
        field: 'purchase_description',
        headerName: 'Purchase Description',
        width: 150,
        sortable: false

    },
    {
        field: 'rate',
        headerName: 'Rate',
        width: 150,
        renderCell: (params: GridRenderCellParams<any, string>) => {
            if (params.value) {
                return (
                    <Typography>&#x20b9; {params.value}.00</Typography>
                );
            }
        },
    },
    {
        field: 'cf_mrp',
        headerName: 'MRP',
        width: 150,
        renderCell: (params: GridRenderCellParams<any, string>) => {
            if (params.value) {
                return (
                    <Typography>&#x20b9; {params.value}.00</Typography>
                );
            }
        },
    },
    {
        field: 'purchase_rate',
        headerName: 'Purchase Rate',
        width: 150,
        renderCell: (params: GridRenderCellParams<any, string>) => {
            if (params.value) {
                return (
                    <Typography>&#x20b9; {params.value}.00</Typography>
                );
            }
        },
    },
    {
        field: 'stock_on_hand',
        headerName: 'Stock On Hand',
        width: 150,
    },
    {
        field: 'hsn_or_sac',
        headerName: 'HSN/SAC',
        width: 150,
    },
    {
        field: 'unit',
        headerName: 'Usage Unit',
        width: 150,
    },
];

const ItemsDataGrid = ({ setSelection, items, paginationModel, setPaginationModel, hasNextPage, loadingItems }: any) => {
    const apiRef = useGridApiRef();
    const paginationMetaRef = React.useRef<GridPaginationMeta>();

    // Memoize to avoid flickering when the `hasNextPage` is `undefined` during refetch
    const paginationMeta = React.useMemo(() => {
        if (
            hasNextPage !== undefined &&
            paginationMetaRef.current?.hasNextPage !== hasNextPage
        ) {
            paginationMetaRef.current = { hasNextPage };
        }
        return paginationMetaRef.current;
    }, [hasNextPage]);

    return (
        <Box sx={{ height: '80vh', width: '100%' }}>
            <DataGrid
                apiRef={apiRef}
                rows={items}
                columns={columns}
                rowHeight={30}
                rowCount={-1}
                getRowId={(row) => row.item_id}
                paginationMode='server'
                paginationModel={paginationModel}
                paginationMeta={paginationMeta}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[25, 50, 100]}
                checkboxSelection
                disableRowSelectionOnClick
                onRowSelectionModelChange={setSelection}
                loading={loadingItems}
            />
        </Box>
    );
}

export default ItemsDataGrid
