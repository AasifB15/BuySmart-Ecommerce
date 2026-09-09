import { createContext, useContext, useEffect, useState } from "react";

const THEME_STORAGE_KEY = "buysmart_theme";
const FALLBACK_STORAGE_KEY = "shoporaTheme";

export const THEMES = {
    LIGHT: "light",
    DARK: "dark",
    SYSTEM: "system",
};

function getSystemTheme() {
    if (
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
        return THEMES.DARK;
    }
    return THEMES.LIGHT;
}

const ThemeContext = createContext({
    theme: THEMES.SYSTEM,
    resolvedTheme: THEMES.LIGHT,
    setTheme: () => {},
    isDark: false,
});

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(() => {
        return (
            localStorage.getItem(THEME_STORAGE_KEY) ||
            localStorage.getItem(FALLBACK_STORAGE_KEY) ||
            THEMES.SYSTEM
        );
    });

    const [resolvedTheme, setResolvedTheme] = useState(() => {
        const saved =
            localStorage.getItem(THEME_STORAGE_KEY) ||
            localStorage.getItem(FALLBACK_STORAGE_KEY) ||
            THEMES.SYSTEM;
        return saved === THEMES.SYSTEM ? getSystemTheme() : saved;
    });

    const setTheme = (newTheme) => {
        setThemeState(newTheme);
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        localStorage.setItem(FALLBACK_STORAGE_KEY, newTheme);
    };

    useEffect(() => {
        const activeTheme =
            theme === THEMES.SYSTEM ? getSystemTheme() : theme;
        setResolvedTheme(activeTheme);
        document.documentElement.setAttribute("data-theme", activeTheme);

        if (theme !== THEMES.SYSTEM) return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = (e) => {
            const currentSystem = e.matches ? THEMES.DARK : THEMES.LIGHT;
            setResolvedTheme(currentSystem);
            document.documentElement.setAttribute("data-theme", currentSystem);
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [theme]);

    return (
        <ThemeContext.Provider
            value={{
                theme,
                resolvedTheme,
                setTheme,
                isDark: resolvedTheme === THEMES.DARK,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}

export default ThemeContext;
