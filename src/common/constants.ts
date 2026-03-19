import { AlertColor } from "@mui/material";

export interface SnackbarAlert {
    severity: AlertColor
    message: string
}

export interface BarcodeMetadata {
    id: string
    associatedField: string
    value: string
    itemName: string
    quantity: number
    rate: number
    mrp?: number
    sku?: string
    selectedSize?: string
    selectedAge?: string
    selectedYear?: number
    selectedMonth?: number
}

export interface Barcode {
    itemName: string
    value: string
    rate: number
    mrp?: number
    sizeLabel?: string
    sizeCode?: string
    age?: string
    uniqueCode?: string,
    sku?: string
}

export const APIConstants = {
    TOKEN: 'https://accounts.zoho.in/oauth/v2/token',
    BOOKS: 'https://www.zohoapis.in/books/v3',
    REDIRECT_URI: 'https://umanz-dev.github.io/lamxi-trading-zoho-barcode-generator/',
    // REDIRECT_URI: 'http://localhost:3000',
    AUTH: 'https://accounts.zoho.in/oauth/v2/auth',
    REFRESH: 'https://accounts.zoho.in/oauth/v2/auth/refresh'
}

export const envConstants = {
    CLIENT_ID: process.env.REACT_APP_CLIENT_ID,
    ORGANIZATION_ID: process.env.REACT_APP_ORGANIZATION_ID
}

export const LogConstants = {
    LOGIN_PROMPT: "Please login to access the Items!",
    LOGIN_SUCCESS: "Successfully logged in!",
    FETCH_ITEMS_ERROR: "Something went wrong while fetching Items!",
    PRINT_BATCODES_ERROR: "Something went wrong while printing the Barcodes!"
}