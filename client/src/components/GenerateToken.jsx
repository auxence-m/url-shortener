import Box from '@mui/material/Box';
import {useState} from "react";
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import Tooltip from '@mui/material/Tooltip';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import InputAdornment from '@mui/material/InputAdornment';
import {styled} from "@mui/material/styles";

const StyledOutlinedInput = styled(OutlinedInput)(({theme}) => ({
    ".MuiOutlinedInput-notchedOutline": {
        border: "2px solid",
        borderColor: theme.palette.divider,
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
        border: "2px solid",
        borderColor: theme.palette.divider,
    }
}));

export default function GenerateToken() {

    const functionEndpoint = "https://url-shortener-949949589385.northamerica-northeast1.run.app";
    const appDomain = "https://url-shortener-470717.web.app/"

    const [url, setUrl] = useState("");
    const [urlError, setUrlError] = useState(false);
    const [urlErrorMessage, setUrlErrorMessage] = useState("");

    const [showAlert, setShowAlert] = useState(false);
    const [appError, setAppError] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    const [shortUrl, setShortUrl] = useState("");

    function validateInput() {
       let testUrl;

       try {
           testUrl = new URL(url);

           if (testUrl.protocol !== "https:" && testUrl.protocol !== "http:") {
               setUrlError(true);
               setUrlErrorMessage("Please enter valid URL. Example: https://example.com");
               return false;
           }

           setUrlError(false);
           setUrlErrorMessage("");
           return true
       } catch (error) {
           setUrlError(true);
           setUrlErrorMessage("Please enter valid URL. Example: https://example.com");
           return false;
       }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (urlError) {
            return
        }

        try {
            const response = await fetch(functionEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    url: url,
                })
            });

            if (response.ok) {
                const data = await response.json();
                setShortUrl(appDomain + data.value);
                setShowAlert(true);
                setAppError(false);
                setAlertMessage("Token generated successfully.");
                setUrl("")
            } else {
                const error = await response.json();
                setShowAlert(true);
                setAppError(true);
                setAlertMessage(error.error);
            }
        } catch (error) {
            setShowAlert(true);
            setAppError(true);
            setAlertMessage("Something unexpected happen. Please try again later");
        }
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text)
            .then(() => {
                setShowAlert(true);
                setAppError(false);
                setAlertMessage("URL copied to clipboard");
            }).catch(() => {
                setShowAlert(true);
                setAppError(true);
                setAlertMessage("Failed to copy URL");
        });
    }

    function closeSnackbar(event, reason) {
        if (reason === "clickaway") {
            return;
        }
        setShowAlert(false);
    }

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
            <Box display={shortUrl === "" ? "flex" : "none"} flexDirection="column" justifyContent="space-between" gap={3} marginTop={3}
                 width={600} maxWidth="95%" component="form" onSubmit={handleSubmit} noValidate>
                <FormControl>
                    <FormLabel sx={{marginBottom: 1}} htmlFor="link">Please enter the URL to be shortened</FormLabel>
                    <TextField id="link"
                               type="url"
                               name="link"
                               placeholder="https://example.com"
                               variant="outlined"
                               autoFocus
                               fullWidth
                               required
                               value={url}
                               error={urlError}
                               helperText={urlErrorMessage}
                               color={urlError ? "error" : "primary"}
                               onChange={(event) => {setUrl(event.target.value)}} />
                </FormControl>
                <Button sx={{padding: 1.2}} variant="contained" type="submit" fullWidth onClick={validateInput}>
                    Shorten URL
                </Button>
            </Box>
            <Box display={shortUrl === "" ? "none" : "flex"} flexDirection="column" width={600} maxWidth="95%" gap={3} marginTop={3}>
                <FormControl>
                    <FormLabel sx={{marginBottom: 1}} htmlFor="read-only-short-link">Shortened URL</FormLabel>
                    <StyledOutlinedInput
                        id="read-only-short-link"
                        defaultValue={shortUrl}
                        readOnly
                        endAdornment={
                            <InputAdornment position="end">
                                <Tooltip title="Copy" arrow>
                                    <IconButton onClick={()=>{copyToClipboard(shortUrl)}}>
                                        <ContentCopyOutlinedIcon></ContentCopyOutlinedIcon>
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        }
                    ></StyledOutlinedInput>
                </FormControl>
                <Button sx={{padding: 1.2}} variant="contained" fullWidth onClick={() => {setShortUrl("")}}>
                    Shorten another URL
                </Button>
            </Box>
            <Snackbar anchorOrigin={{vertical: "top", horizontal: "center"}} open={showAlert} autoHideDuration={5000} onClose={closeSnackbar}>
                <Alert severity={appError ? "error" : "success"} variant="filled" onClose={closeSnackbar} sx={{width: "100%"}}>
                    {alertMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}