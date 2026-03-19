import React from 'react'
import Box from '@mui/material/Box'
import ItemsDataGrid from '../components/ItemsDataGrid'
import BulkActionsButton from '../components/BulkActionsButton'
import PrintBarcodeDialog from '../components/PrintBarcodeDialog'
import { GridPaginationModel, GridRowSelectionModel } from '@mui/x-data-grid';
import { BarcodeMetadata, LogConstants } from '../common/constants'
import { fetchItems } from '../api/api'


const Items = ({ setAlert, searchText }: any) => {
    const [selection, setSelection] = React.useState<GridRowSelectionModel>([]);
    const [openPrintBarcodeDialog, setOpenPrintBarcodeDialog] = React.useState<boolean>(false)
    const [barcodeMetadata, setBarcodeMetadata] = React.useState<BarcodeMetadata[]>([])
    const [items, setItems] = React.useState([])
    const [loadingItems, setLoadingItems] = React.useState<boolean>(false)
    const [hasNextPage, setHasNextPage] = React.useState<boolean>(false)
    const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
        pageSize: 25,
        page: 0,
    });

    React.useEffect(() => {
        populateItems()
    }, [paginationModel, searchText])


    React.useEffect(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const newBarcodeMetadata = selection.map((selectedId: any) => items.find((item: any) => item.item_id === selectedId))
            .map(({ item_id, name, sku, rate, cf_mrp }: any) => {
                return {
                    id: item_id,
                    associatedField: "SKU",
                    value: sku,
                    itemName: name,
                    quantity: 1,
                    rate: rate,
                    mrp: cf_mrp ? Number(cf_mrp) : undefined,
                    sku: sku,
                    selectedYear: currentYear,
                    selectedMonth: currentMonth
                }
            })
        setBarcodeMetadata(newBarcodeMetadata)
    }, [selection, items])

    const populateItems = async () => {
        try {
            setSelection([])
            setLoadingItems(true)
            const response = await fetchItems(paginationModel, searchText)
            setItems(response.data.items)
            setHasNextPage(response.data.page_context.has_more_page)
        } catch (err: any) {
            setAlert({
                severity: "error",
                message: LogConstants.FETCH_ITEMS_ERROR
            })
        } finally {
            setLoadingItems(false)
        }
    }

    return (
        <Box sx={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
            <BulkActionsButton selection={selection} setOpenPrintBarcodeDialog={setOpenPrintBarcodeDialog} setAlert={setAlert} />
            <ItemsDataGrid selection={selection} setSelection={setSelection} items={items} paginationModel={paginationModel} setPaginationModel={setPaginationModel} hasNextPage={hasNextPage} loadingItems={loadingItems} />
            <PrintBarcodeDialog openPrintBarcodeDialog={openPrintBarcodeDialog} setOpenPrintBarcodeDialog={setOpenPrintBarcodeDialog} barcodeMetadata={barcodeMetadata} setBarcodeMetadata={setBarcodeMetadata} setAlert={setAlert} />
        </Box>
    )
}

export default Items