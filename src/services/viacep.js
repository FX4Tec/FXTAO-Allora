import axios from 'axios';

const viacep = axios.create({
    baseURL: 'https://viacep.com.br/ws',
});

export const getAddressByCep = async (cep) => {
    try {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) {
            throw new Error('CEP inválido.');
        }
        const response = await viacep.get(`/${cleanCep}/json/`);
        if (response.data.erro) {
            throw new Error('CEP não encontrado.');
        }
        return response.data;
    } catch (error) {
        throw error;
    }
};
