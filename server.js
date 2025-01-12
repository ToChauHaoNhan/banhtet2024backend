import express from 'express';
import { google } from 'googleapis';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config(); 

const app = express();
const port = 3000;

app.use(bodyParser.json());

const keys = {
    client_email: process.env.CLIENT_EMAIL,
    private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n')
};

async function checkSheets(sheetName) {
    const client = new google.auth.JWT(
        keys.client_email,
        undefined,
        keys.private_key,
        ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    try {
        await client.authorize();
        const response = await google.sheets({ version: 'v4', auth: client }).spreadsheets.values.get({
            spreadsheetId: '15v4ni53TXxgzWow4lZws5L07bCg8Ke_Yomw_ZdiBeso', 
            range: `${sheetName}!O1`
        });
        const data = response.data.values;
        return data ? data[0][0] : null; 
    } catch (error) {
        console.error('Error retrieving sheet data:', error);
        return null;
    }
}

app.get('/sheets/:sheetName', async (req, res) => {
    const sheetName = req.params.sheetName;
    const data = await checkSheets(sheetName);
    if (data) {
        res.json({ data });
    } else {
        res.status(500).json({ error: 'Error fetching sheet data' });
    }
});

async function writeToSheet(rowValues, sheetName) {
    const client = new google.auth.JWT(
        keys.client_email,
        undefined,
        keys.private_key,
        ['https://www.googleapis.com/auth/spreadsheets']
    );

    const data = await checkSheets(sheetName);
    if (data > 20) { 
        throw new Error('Pot is full.'); 
    }

    try {
        await client.authorize();
        await google.sheets({ version: 'v4', auth: client }).spreadsheets.values.append({
            spreadsheetId: '15v4ni53TXxgzWow4lZws5L07bCg8Ke_Yomw_ZdiBeso',
            range: `${sheetName}!A:N`,
            valueInputOption: 'RAW',
            resource: {
                values: [rowValues]
            }
        });
    } catch (error) {
        console.error('Error writing to sheet:', error);
        throw error;
    }
}

app.post('/sheets/order/:sheetName', async (req, res) => {
    const { 
        banh_tet_man_nho, 
        banh_tet_man,
        banh_tet_man_dac_biet, 
        trung_muoi_them, 
        banh_tet_chuoi, 
        banh_tet_chay,
        ten_nguoi_dat,
        lien_he,
        custom,
        giao_hang,
        nguoi_nhan,
        so_dien_thoai,
        dia_chi,
        thoi_gian
    } = req.body;
    const sheetName = req.params.sheetName;
    const rowValues = [
        banh_tet_man_nho, 
        banh_tet_man, 
        banh_tet_man_dac_biet, 
        trung_muoi_them, 
        banh_tet_chuoi, 
        banh_tet_chay,         
        ten_nguoi_dat,
        lien_he,
        custom,
        giao_hang,
        nguoi_nhan,
        so_dien_thoai,
        dia_chi,
        thoi_gian
    ];

    try {
        await writeToSheet(rowValues, sheetName);
        res.status(200).json({ message: 'Data written successfully' });
    } catch (error) {
        if (error.message === 'Pot is full.') {
            res.status(400).json({ error: error.message });
        }
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
