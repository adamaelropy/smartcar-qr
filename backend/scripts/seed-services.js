const prisma = require("../db");

const NEW_SERVICES = [
    {
        service_name: "AutoFix Garage",
        service_type: "BATTERY_REPLACEMENT",
        location: "Antelias",
        availability: true
    },
    {
        service_name: "Beirut Auto Care",
        service_type: "BRAKE_SERVICE",
        location: "Beirut",
        availability: true
    },
    {
        service_name: "DriveSafe Center",
        service_type: "ENGINE_DIAGNOSTICS",
        location: "Jal El Dib",
        availability: true
    },
    {
        service_name: "Lebanon Auto Service",
        service_type: "AC_SERVICE",
        location: "Tripoli",
        availability: true
    },
    {
        service_name: "ProMechanic",
        service_type: "CAR_DETAILING",
        location: "Saida",
        availability: true
    },
    {
        service_name: "Precision Wheels",
        service_type: "WHEEL_ALIGNMENT",
        location: "Zahle",
        availability: true
    },
    {
        service_name: "BalancePro",
        service_type: "WHEEL_BALANCING",
        location: "Byblos",
        availability: true
    },
    {
        service_name: "ClearView Auto Glass",
        service_type: "WINDSHIELD_REPAIR",
        location: "Beirut",
        availability: true
    },
    {
        service_name: "GlassPro Lebanon",
        service_type: "GLASS_REPLACEMENT",
        location: "Jounieh",
        availability: true
    },
    {
        service_name: "MotorWorks Garage",
        service_type: "ENGINE_REPAIR",
        location: "Hazmieh",
        availability: false
    },
    {
        service_name: "GearShift Auto",
        service_type: "TRANSMISSION_SERVICE",
        location: "Baabda",
        availability: true
    },
    {
        service_name: "SmoothRide Motors",
        service_type: "SUSPENSION_REPAIR",
        location: "Antelias",
        availability: true
    },
    {
        service_name: "ElectroAuto Center",
        service_type: "CAR_ELECTRICAL",
        location: "Jal El Dib",
        availability: true
    },
    {
        service_name: "Certified Auto Inspect",
        service_type: "INSPECTION_SERVICE",
        location: "Tripoli",
        availability: true
    },
    {
        service_name: "ShinePro Detailing",
        service_type: "CAR_POLISHING",
        location: "Saida",
        availability: false
    },
    {
        service_name: "RoadRescue Fuel",
        service_type: "FUEL_DELIVERY",
        location: "Beirut",
        availability: true
    }
];

async function main() {
    let created = 0;
    let skipped = 0;

    for (const service of NEW_SERVICES) {
        const existing = await prisma.service.findFirst({
            where: { service_type: service.service_type },
            select: { service_id: true }
        });

        if (existing) {
            skipped += 1;
            continue;
        }

        await prisma.service.create({ data: service });
        created += 1;
    }

    const total = await prisma.service.count();

    console.log(
        JSON.stringify({
            ok: true,
            created,
            skipped,
            totalServices: total
        })
    );
}

main()
    .catch((error) => {
        console.log(JSON.stringify({ ok: false, error: error.message }));
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
