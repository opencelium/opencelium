export default interface LicenseModel {
    _id: string,
    name: string,
    key: string,
}
export enum ActivationRequestStatus {
    PENDING= 'PENDING',
    PROCESSED= 'PROCESSED',
    EXPIRED= 'EXPIRED'

}
