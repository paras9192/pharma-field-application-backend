"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectPaymentDto = exports.PaymentMode = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var PaymentMode;
(function (PaymentMode) {
    PaymentMode["CASH"] = "CASH";
    PaymentMode["CHEQUE"] = "CHEQUE";
    PaymentMode["UPI"] = "UPI";
    PaymentMode["NEFT"] = "NEFT";
    PaymentMode["BANK_TRANSFER"] = "BANK_TRANSFER";
})(PaymentMode || (exports.PaymentMode = PaymentMode = {}));
class CollectPaymentDto {
    billId;
    amount;
    paymentMode;
    referenceNumber;
    notes;
}
exports.CollectPaymentDto = CollectPaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CollectPaymentDto.prototype, "billId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CollectPaymentDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: PaymentMode }),
    (0, class_validator_1.IsEnum)(PaymentMode),
    __metadata("design:type", String)
], CollectPaymentDto.prototype, "paymentMode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Cheque number / UPI ref / NEFT ref' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CollectPaymentDto.prototype, "referenceNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CollectPaymentDto.prototype, "notes", void 0);
//# sourceMappingURL=collect-payment.dto.js.map