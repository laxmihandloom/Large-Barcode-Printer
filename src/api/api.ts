import axios from "axios";
import { APIConstants, envConstants } from "../common/constants";
import { requireAccessToken } from "../common/auth";
import { GridPaginationModel } from "@mui/x-data-grid";

export const fetchItems = async (paginationModel: GridPaginationModel, searchText: string) => {
    const URL: string = APIConstants.BOOKS + "/items"
    const params: any = {
        organization_id: envConstants.ORGANIZATION_ID,
        page: paginationModel.page + 1,
        per_page: paginationModel.pageSize,
        search_text: searchText
    }
    // Throws SessionExpiredError rather than sending a known-dead token and
    // surfacing Zoho's 401 as a generic "something went wrong".
    const headers = {
        Authorization: `Zoho-oauthtoken ${requireAccessToken()}`
    }
    const response = await axios.get(URL, { params, headers })
    return response
}
