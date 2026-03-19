import React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Dashboard from "./components/Dashboard";
import {
  APIConstants,
  LogConstants,
  SnackbarAlert,
  envConstants,
} from "./common/constants";
import Items from "./pages/Items";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import useDebounce from "./hooks/useDebounce";

const App = () => {
  const [alert, setAlert] = React.useState<SnackbarAlert | null>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);
  const [searchText, setSearchText] = React.useState<string>("");

  const debouncedSearchText = useDebounce(searchText, 1000)

  const handleLogin = () => {
    const URL = `${APIConstants.AUTH}?scope=ZohoBooks.settings.READ&client_id=${envConstants.CLIENT_ID}&response_type=token&redirect_uri=${APIConstants.REDIRECT_URI}&access_type=offline`;
    window.location.assign(URL);
  };

  const handleRefresh = () => {
    // const URL = `${APIConstants.REFRESH}?scope=ZohoBooks.settings.READ&client_id=${envConstants.CLIENT_ID}&response_type=token&redirect_uri=${APIConstants.REDIRECT_URI}&access_type=offline`
    // window.location.assign(URL)
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("expiresIn");
    window.location.assign(APIConstants.REDIRECT_URI);
    setIsAuthenticated(false);
  };

  React.useEffect(() => {
    if (
      localStorage.getItem("accessToken") &&
      localStorage.getItem("expiresIn") &&
      new Date() <= new Date(localStorage.getItem("expiresIn")!)
    ) {
      setIsAuthenticated(true);
      setAlert({
        severity: "success",
        message: LogConstants.LOGIN_SUCCESS,
      });
      return;
    }
    const urlParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = urlParams.get("access_token");
    const expiresIn = Number(urlParams.get("expires_in"));
    if (accessToken && expiresIn) {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem(
        "expiresIn",
        new Date(Date.now() + expiresIn * 1000).toString()
      );
      setIsAuthenticated(true);
    }
  }, []);

  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setAlert(null);
  };

  return (
    <div>
      <Dashboard
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        isAuthenticated={isAuthenticated}
        searchText={searchText}
        setSearchText={setSearchText}
      >
        {isAuthenticated ? (
          <Items setAlert={setAlert} searchText={debouncedSearchText} />
        ) : (
          <Box
            sx={{
              height: "85vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
            }}
          >
            <Typography>Please login to access the Items &#128517;</Typography>
          </Box>
        )}
        {!!alert && (
          <Snackbar
            open={!!alert}
            autoHideDuration={6000}
            onClose={handleClose}
          >
            <Alert onClose={handleClose} severity={alert.severity}>
              {alert.message}
            </Alert>
          </Snackbar>
        )}
      </Dashboard>
    </div>
  );
};

export default App;
