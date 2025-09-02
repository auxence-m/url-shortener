import './App.css'
import { ThemeProvider, createTheme} from '@mui/material/styles';
import {CssBaseline} from "@mui/material";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import GenerateToken from "./components/GenerateToken.jsx";
import Redirect from "./components/Redirect.jsx";
import SwitchTheme from "./components/SwitchTheme.jsx";

const firebaseConfig = {
    apiKey: "AIzaSyDsmqqa_2M3od-pqRyO14th6eEZGk-DlHE",
    authDomain: "url-shortener-470717.firebaseapp.com",
    projectId: "url-shortener-470717",
    storageBucket: "url-shortener-470717.firebasestorage.app",
    messagingSenderId: "949949589385",
    appId: "1:949949589385:web:995eee35978ae8206ca358",
    measurementId: "G-6MF80XHVDC"
};

const theme = createTheme({
    colorSchemes: {
        dark: true,
    },
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const router = createBrowserRouter([
    {path: "/", element: <GenerateToken />},
    {path: "/:token", element: <Redirect />},
]);

function App() {
  return (
      <ThemeProvider theme={theme}>
          <CssBaseline />
          <SwitchTheme></SwitchTheme>
          <RouterProvider router={router}/>
      </ThemeProvider>
  )
}

export default App
