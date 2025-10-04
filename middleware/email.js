import axios from "axios";

const CDN_URL = process.env.CDN_URL

/**
 * HTML имэйл илгээх
 * @param emailBody Имэйлд илгээх объект
 */
export const sendHtmlEmail = async (emailBody) => {
    try {
        const response = await axios.post(`${CDN_URL}/email/html`, emailBody);
        return response.data;
    } catch (error) {
        console.error("Имэйл илгээхэд алдаа гарлаа:", error.message);
        throw error;
    }
};
