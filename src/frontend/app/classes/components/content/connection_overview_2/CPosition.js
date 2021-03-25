import CCoordinates from "@classes/components/content/connection_overview_2/CCoordinates";

export default class CPosition{

    static NEIGHBOURHOOD = 50;

    static isCentralizedByX(from, to){
        return CCoordinates.getCenter(from).x === CCoordinates.getCenter(to).x;
    }
    static isCentralizedByY(from, to){
        return CCoordinates.getCenter(from).y === CCoordinates.getCenter(to).y;
    }

    //case 1.
    //-------      -------
    //|  a  |----->|  b  |
    //-------      -------
    //
    static isCase1(from, to){
        return from.x + from.width + CPosition.NEIGHBOURHOOD < to.x && CPosition.isCentralizedByY(from, to);
    }

    //case 2.
    //  ______
    // |      ↓
    //------------
    //| a |   b  |
    //------------
    //
    //    ______
    //   |     |
    //-------  |
    //| a/b |  |
    //-------  |
    //   ↑_____|
    //
    //  ______
    // ↓      |
    //------------
    //| b |   a  |
    //------------
    //
    static isCase2(from, to){
        return (from.x === to.x || CPosition.isCentralizedByX(from, to) || (from.x < to.x && from.x + from.width + this.NEIGHBOURHOOD >= to.x) || (from.x > to.x && from.x <= to.x + to.width + this.NEIGHBOURHOOD))
            && (from.y < to.y + to.height + this.NEIGHBOURHOOD) && from.y >= to.y;
    }

    //case 3.
    //-------      -------
    //|  b  |<-----|  a  |
    //-------      -------
    //
    static isCase3(from, to){
        return from.x > to.x + to.width + CPosition.NEIGHBOURHOOD && CPosition.isCentralizedByY(from, to);
    }

    //case 4.
    //-------
    //|  a  |--    -------
    //-------  |__>|  b  |
    //             -------
    //
    static isCase4(from, to){
        const centeredFromY = CCoordinates.getCenter(from).y;
        const centeredToY = CCoordinates.getCenter(to).y;
        return from.x + from.width + CPosition.NEIGHBOURHOOD < to.x && ((centeredFromY < centeredToY && centeredFromY + from.height > centeredToY) || (centeredFromY > centeredToY && centeredFromY < centeredToY + to.height));
    }

    //case 5.
    //-------
    //|  a  |------
    //-------     |
    //            ↓
    //         -------
    //         |  b  |
    //         -------
    //
    static isCase5(from, to) {
        const centeredFromY = CCoordinates.getCenter(from).y;
        const centeredToY = CCoordinates.getCenter(to).y;
        return from.x + from.width <= to.x && centeredFromY + from.height <= centeredToY;
    }

    //case 6.
    //-------
    //|  a  |
    //-------
    //   |______
    //         ↓
    //      -------
    //      |  b  |
    //      -------
    //
    //      -------
    //      |  a  |
    //      -------
    //    _____|
    //   ↓
    //-------
    //|  b  |
    //-------
    //
    static isCase6(from, to) {
        const centeredFromY = CCoordinates.getCenter(from).y;
        const centeredToY = CCoordinates.getCenter(to).y;
        return ((from.x === to.x) || (from.x > to.x && from.x < to.x + to.width) || (from.x + from.width > to.x && from.x < to.x)) && (centeredFromY + from.height + this.NEIGHBOURHOOD <= centeredToY);
    }

    //case 7.
    //-------
    //|  a  |
    //-------
    //   ↓
    //-------
    //|  b  |
    //-------
    //
    static isCase7(from, to) {
        const centeredFromY = CCoordinates.getCenter(from).y;
        const centeredToY = CCoordinates.getCenter(to).y;
        return CPosition.isCentralizedByX(from, to) && centeredFromY + from.height + this.NEIGHBOURHOOD < centeredToY;
    }

    //case 8.
    //--------
    //|  a   |--
    //|------| |
    //|  b   |<-
    //--------
    //
    //--------
    //|  b   |<-
    //|------| |
    //|  a   |--
    //--------
    //
    static isCase8(from, to) {
        const centeredFromY = CCoordinates.getCenter(from).y;
        const centeredToY = CCoordinates.getCenter(to).y;
        return CPosition.isCentralizedByX(from, to) && ((centeredFromY < centeredToY && centeredFromY + from.height > centeredToY) || (centeredFromY <= centeredToY + to.height + this.NEIGHBOURHOOD));
    }

    //case 9.
    //         -------
    //    _____|  a  |
    //   |     -------
    //   |
    //   ↓
    //-------
    //|  b  |
    //-------
    //
    static isCase9(from, to) {
        const centeredFromY = CCoordinates.getCenter(from).y;
        const centeredToY = CCoordinates.getCenter(to).y;
        return from.x >= to.x + to.width && centeredFromY + from.height <= centeredToY;
    }

    //case 10.
    //-------
    //|  b  |<--   -------
    //-------  |___|  a  |
    //             -------
    //
    static isCase10(from, to) {
        const centeredFromY = CCoordinates.getCenter(from).y;
        const centeredToY = CCoordinates.getCenter(to).y;
        return from.x >= to.x + to.width + this.NEIGHBOURHOOD && centeredFromY < centeredToY + to.height ;
    }

    //case 11.
    //-------
    //|  b  |
    //-------
    //   ↑
    //   |        -------
    //   |________|  a  |
    //            -------
    //
    static isCase11(from, to) {
        const centeredFromY = CCoordinates.getCenter(from).y;
        const centeredToY = CCoordinates.getCenter(to).y;
        return from.x >= to.x + to.width && centeredFromY >= centeredToY + to.height;
    }

    //case 12.
    //-------
    //|  b  |
    //-------
    //   ↑__
    //     |
    //  -------
    //  |  a  |
    //  -------
    //
    //    -------
    //    |  b  |
    //    -------
    //    __↑
    //   |
    //-------
    //|  a  |
    //-------
    //
    static isCase12(from, to) {
        const centeredFromY = CCoordinates.getCenter(from).y;
        const centeredToY = CCoordinates.getCenter(to).y;
        return ((from.x === to.x) || (from.x < to.x && from.x + from.width > to.x) || (from.x > to.x && from.x < to.x + to.width)) && centeredFromY >= centeredToY + to.height ;
    }

    //case 13.
    //-------
    //|  b  |
    //-------
    //   ↑
    //   |
    //-------
    //|  a  |
    //-------
    //
    static isCase13(from, to) {
        const centeredFromY = CCoordinates.getCenter(from).y;
        const centeredToY = CCoordinates.getCenter(to).y;
        return CPosition.isCentralizedByX(from, to) && centeredFromY >= centeredToY + to.height + this.NEIGHBOURHOOD ;
    }

    //case 14.
    //      -------
    //      |  b  |
    //      -------
    //         ↑
    //         |
    //-------  |
    //|  a  |---
    //-------
    //
    static isCase14(from, to) {
        const centeredFromY = CCoordinates.getCenter(from).y;
        const centeredToY = CCoordinates.getCenter(to).y;
        return from.x + from.width <= to.x && centeredFromY >= centeredToY + to.height ;
    }

    //case 15.

    //------------
    //| a |   b  |
    //------------
    //  |_____↑
    //
    //------------
    //| b |   a  |
    //------------
    //  ↑_____|
    //
    static isCase15(from, to){
        return ((from.x === to.x) || (from.x < to.x && from.x + from.width + this.NEIGHBOURHOOD >= to.x) || (from.x > to.x && from.x <= to.x + to.width + this.NEIGHBOURHOOD))
            && (from.y + from.height + this.NEIGHBOURHOOD > to.y) && from.y < to.y;
    }
}