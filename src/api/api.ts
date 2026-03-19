import axios from "axios";
import { APIConstants, envConstants } from "../common/constants";
import { GridPaginationModel } from "@mui/x-data-grid";

export const fetchItems = async (paginationModel: GridPaginationModel, searchText: string) => {
    const URL: string = APIConstants.BOOKS + "/items"
    const params: any = {
        organization_id: envConstants.ORGANIZATION_ID,
        page: paginationModel.page + 1,
        per_page: paginationModel.pageSize,
        search_text: searchText
    }
    const headers = {
        Authorization: `Zoho-oauthtoken ${localStorage.getItem('accessToken')}`
    }
    const response = await axios.get(URL, { params, headers })
    return response
}
