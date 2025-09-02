import {styled, useColorScheme} from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Box from "@mui/material/Box";
import Tooltip from '@mui/material/Tooltip';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';

const StyledIconButton = styled(IconButton)(({theme}) => ({
    color: theme.palette.primary.main,
    [theme.breakpoints.up("md")]: {
        padding: "5px"
    }
}));

export const ThemeToggle = styled(Box)({
    position: "fixed",
    top: "1rem",
    right: "2.5rem",
});

export default function SwitchTheme() {
    const {mode, setMode} = useColorScheme();
    if (!mode) {
        return null;
    }

    function handleClick() {
        setMode(mode === "light" ? "dark" : "light");
    }

    return (
        <ThemeToggle>
            <Tooltip title={mode === "light" ? "Turn off the light" : "Turn on the light"} arrow>
                <StyledIconButton onClick={handleClick} sx={{border: "1px solid", borderRadius: "0.5rem"}}>
                    {mode === "dark" ? <LightModeOutlinedIcon/> : <DarkModeOutlinedIcon/>}
                </StyledIconButton>
            </Tooltip>
        </ThemeToggle>
    );
}