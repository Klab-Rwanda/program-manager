import api from '../api';

interface JitsiTokenResponse {
    token: string;
}

export const getJitsiToken = async (roomName: string): Promise<string> => {
    const response = await api.get<any, { data: { data: JitsiTokenResponse } }>(`/jitsi/token/${roomName}`);
    return response.data.data.token;
};