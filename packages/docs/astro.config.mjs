import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
    integrations: [
        starlight({
            title: "ts2shell",
            description: "Transpile TypeScript to bash, sh, PowerShell, and batch.",
            defaultLocale: "en",
            locales: {
                en: {
                    label: "English",
                    lang: "en"
                }
            },
            sidebar: [
                {
                    label: "Guides",
                    autogenerate: { directory: "guides" }
                },
                {
                    label: "Reference",
                    autogenerate: { directory: "reference" }
                }
            ]
        })
    ]
});
