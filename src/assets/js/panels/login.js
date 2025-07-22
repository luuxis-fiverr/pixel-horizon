const { AZauth, Mojang } = require('minecraft-java-core');
const { ipcRenderer } = require('electron');

import { popup, database, changePanel, accountSelect, addAccount, config, setStatus } from '../utils.js';

class Login {
    static id = "login";
    async init(config) {
        this.config = config;
        this.db = new database();
        this.getCrack();
        document.querySelector('.cancel-home').addEventListener('click', () => {
            document.querySelector('.cancel-home').style.display = 'none'
            changePanel('settings')
        })
    }

    async getCrack() {
        console.log('Initializing offline login...');
        let popupLogin = new popup();
        let emailOffline = document.querySelector(".login-box .input-group .username");
        let connectOffline = document.querySelector('.connect-offline');

        connectOffline.addEventListener('click', async () => {
            if (emailOffline.value.length < 3) {
                popupLogin.openPopup({
                    title: 'Erreur',
                    content: 'Votre pseudo doit faire au moins 3 caractères.',
                    options: true
                });
                return;
            }

            if (emailOffline.value.match(/ /g)) {
                popupLogin.openPopup({
                    title: 'Erreur',
                    content: 'Votre pseudo ne doit pas contenir d\'espaces.',
                    options: true
                });
                return;
            }

            let MojangConnect = await Mojang.login(emailOffline.value);

            if (MojangConnect.error) {
                popupLogin.openPopup({
                    title: 'Erreur',
                    content: MojangConnect.message,
                    options: true
                });
                return;
            }
            await this.saveData(MojangConnect)
            popupLogin.closePopup();
        });
    }

    async saveData(connectionData) {
        let configClient = await this.db.readData('configClient');
        let account = await this.db.createData('accounts', connectionData)
        let instanceSelect = configClient.instance_selct
        let instancesList = await config.getInstanceList()
        configClient.account_selected = account.ID;

        for (let instance of instancesList) {
            if (instance.whitelistActive) {
                let whitelist = instance.whitelist.find(whitelist => whitelist == account.name)
                if (whitelist !== account.name) {
                    if (instance.name == instanceSelect) {
                        let newInstanceSelect = instancesList.find(i => i.whitelistActive == false)
                        configClient.instance_selct = newInstanceSelect.name
                        await setStatus(newInstanceSelect.status)
                    }
                }
            }
        }

        await this.db.updateData('configClient', configClient);
        await addAccount(account);
        await accountSelect(account);
        changePanel('home');
    }
}
export default Login;