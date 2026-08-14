import notificationService from "../../notification/notificationService.js";

const process = async (

    evento

) => {

    await notificationService.process(

        evento

    );

};

export default {

    process

};