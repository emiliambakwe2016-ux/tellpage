import {chromium as playwright} from 'playwright';
function options(extra=[]){return {executablePath:process.env.CHROME_BIN||playwright.executablePath(),args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--no-zygote','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream',...extra],env:{...process.env,LD_LIBRARY_PATH:'/tmp/chrome-deps:/tmp/chrome-deps/al2023/lib'},headless:true};}
export async function launch(extra=[]){return playwright.launch(options(extra));}
export async function launchPersistent(profile){return playwright.launchPersistentContext(profile,options());}
