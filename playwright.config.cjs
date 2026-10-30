const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({testDir:'tests',workers:2,use:{baseURL:'http://127.0.0.1:5173',screenshot:'only-on-failure'},webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5173',url:'http://127.0.0.1:5173',reuseExistingServer:!process.env.CI}});
