-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('TYRE_CHANGE', 'OIL_CHANGE', 'CAR_WASH', 'TOW_SERVICE');

-- CreateEnum
CREATE TYPE "CommunicationType" AS ENUM ('MESSAGE', 'CALL');

-- CreateEnum
CREATE TYPE "CommunicationDirection" AS ENUM ('SENT', 'RECEIVED');

-- CreateTable
CREATE TABLE "User" (
    "user_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "age" INTEGER NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "vehicle_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "plate_number" VARCHAR(20) NOT NULL,
    "car_name" VARCHAR(100) NOT NULL,
    "year_model" INTEGER NOT NULL,
    "qr_token" VARCHAR(100) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("vehicle_id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "contact_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "relative_name" VARCHAR(100) NOT NULL,
    "relative_phone" VARCHAR(20) NOT NULL,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("contact_id")
);

-- CreateTable
CREATE TABLE "Service" (
    "service_id" SERIAL NOT NULL,
    "service_name" VARCHAR(100) NOT NULL,
    "service_type" "ServiceType" NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "availability" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("service_id")
);

-- CreateTable
CREATE TABLE "Communication" (
    "communication_id" BIGINT NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "type" "CommunicationType" NOT NULL,
    "direction" "CommunicationDirection" NOT NULL,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("communication_id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "reset_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("reset_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_user_id_key" ON "Vehicle"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plate_number_key" ON "Vehicle"("plate_number");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_qr_token_key" ON "Vehicle"("qr_token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle"("vehicle_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
