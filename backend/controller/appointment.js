import db from '../method.js';
import appointmentSchema from '../schema/appointment.js';

class AppointmentController {

    // 1. Add Appointment
    async addappointment(req, res, next) {
        try {
            const { name, email, phone, date, timeSlot } = req.body;

            if (!name || !email || !phone || !date || !timeSlot) {
                req.api_error = { statusCode: 400, message: "Missing required fields" };
                return next();
            }

            await db.checkTableExists('tblappointments', appointmentSchema);

            // Check if slot is already booked
            const data = await db.fetchdata({ date, timeSlot, status: { $ne: "Cancelled" } }, 'tblappointments', appointmentSchema);
            if (data && data.length > 0) {
                req.api_error = { statusCode: 400, message: "This time slot is already booked." };
                return next();
            }

            const result = await db.executdata('tblappointments', appointmentSchema, 'i', req.body);
            req.api_data = result;
            req.api_message = "Appointment booked successfully";
            next();

        } catch (error) {
            console.error("Add Appointment error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            next();
        }
    }

    // 2. List Appointments
    async listappointment(req, res, next) {
        try {
            await db.checkTableExists('tblappointments', appointmentSchema);
            const query = {};
            if (req.body.status) query.status = req.body.status;
            if (req.body.date) query.date = req.body.date;

            const data = await db.fetchdata(query, 'tblappointments', appointmentSchema);
            console.log("Fetched appointments for list:", data.length);
            req.api_data = data;
            next();

        } catch (error) {
            console.error("List Appointment error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            next();
        }
    }

    // 3. Update Appointment
    async updateappointment(req, res, next) {
        try {
            const { id } = req.body;
            if (!id) {
                req.api_error = { statusCode: 400, message: "Appointment ID is required" };
                return next();
            }

            await db.checkTableExists('tblappointments', appointmentSchema);
            const { id: _, ...updateFields } = req.body;

            const result = await db.executdata('tblappointments', appointmentSchema, 'u', {
                condition: { _id: id },
                update: updateFields
            });

            req.api_data = result;
            req.api_message = "Appointment updated successfully";
            next();

        } catch (error) {
            console.error("Update Appointment error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            next();
        }
    }

    // 4. Delete Appointment
    async deleteappointment(req, res, next) {
        try {
            const { id } = req.body;
            if (!id) {
                req.api_error = { statusCode: 400, message: "Appointment ID is required" };
                return next();
            }

            await db.checkTableExists('tblappointments', appointmentSchema);
            const result = await db.executdata('tblappointments', appointmentSchema, 'd', { _id: id });

            req.api_data = result;
            req.api_message = "Appointment deleted successfully";
            next();

        } catch (error) {
            console.error("Delete Appointment error:", error);
            req.api_error = { statusCode: 500, message: "Internal server error", stack: error.stack };
            next();
        }
    }
}

export default new AppointmentController();
