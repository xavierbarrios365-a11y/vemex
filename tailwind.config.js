/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{ts,tsx}"
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#4682b4",
                "safety-orange": "#ff6700",
                "danger-red": "#b91c1c",
                "background-light": "#f6f7f8",
                "background-dark": "#15191d",
                "card-dark": "#1e242a",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"]
            }
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
}
