const { Spline, Vec } = require('./spline');

class Map {
    constructor(document, width, height) {
        // メンバ変数初期化

        // 道リストクリア
        this._roads = [];

        // 現在アクティブな道
        this._sp = new Spline();

        // 車のリスト
        this._allCars = [];

        // キャンバスの幅と高さ
        this._width = width;
        this._height = height;

        // オフスクリーンキャンバス作成
        this._offScrCanvas = document.createElement('canvas');
        this._offScrCanvas.width = width;
        this._offScrCanvas.height = height;
        this._offScrCtx = this._offScrCanvas.getContext('2d');
    }

    clear() {
        this._roads = [];
    }

    addPoint(x, y) {
        this._sp.addPoint(x, y);
    }

    genNewRoad() {
        // スプライン曲線生成
        if (this._sp.genSpline()) {
            // 成功
            this._roads.push(this._sp); // 道リストに追加
            this._sp = new Spline();    // 新しいスプラインオブジェクトをカレントにする
        }
    }

    updateOffScrCanvas() {
        // クリア
        this._offScrCtx.fillStyle = '#000000';
        this._offScrCtx.fillRect(0, 0, this._width, this._height);

        // 道の個数
        let nRoads = this._roads.length;

        // 道を先に描く
        // this._offScrCtx.fillStyle = '#105090';
        this._offScrCtx.strokeStyle = '#105090';
        this._offScrCtx.lineWidth = 20;
        this._offScrCtx.lineCap = 'round';
        for (let i=0; i<nRoads; i++) {
            let road = this._roads[i];
            let nPoints = road.count();
            let step = 1/(nPoints*30);
            // 線で描画
            this._offScrCtx.beginPath();
            let bFirst = true;
            for (let t=0.0; t<1.0; t+=step) {
                let pt = road.interp(t);
                if (bFirst) {
                    bFirst = false;
                    this._offScrCtx.moveTo(pt.x, pt.y);
                } else {
                    this._offScrCtx.lineTo(pt.x, pt.y);
                }
            }
            this._offScrCtx.stroke();
            // 点で描画
            // for (let t=0.0; t<1.0; t+=step) {
            //     let pt = road.interp(t);
            //     this._offScrCtx.beginPath();
            //     this._offScrCtx.arc(pt.x, pt.y, 2, 0, Math.PI * 2, false);
            //     this._offScrCtx.fill();
            // }
        }
    
        // 通過点は後
        this._offScrCtx.fillStyle = '#ffffff';
        for (let i=0; i<nRoads; i++) {
            let road = this._roads[i];
            let nPoints = road.count();
            for (let j=0; j<nPoints; j++) {
                let pt = road.getPoint(j);
                this._offScrCtx.beginPath();
                this._offScrCtx.arc(pt.x, pt.y, 5, 0, Math.PI * 2, false);
                this._offScrCtx.fill();
            }
        }

        // まだ未登録の通過点を最後に描画
        let nPoints = this._sp.count();
        for (let i=0; i<nPoints; i++) {
            let pt = this._sp.getPoint(i);
            this._offScrCtx.beginPath();
            this._offScrCtx.arc(pt.x, pt.y, 5, 0, Math.PI * 2, false);
            this._offScrCtx.fill();
        }
    }

    genNewCars() {
        let carsPerRoad = 7;

        // 初期化
        // _allCarsのフォーマット：
        // this._allCars = [
        //      [{
        //        t:    // 位置(0<=t<1)
        //        dt:   // 変位(スピードおよび方向)
        //      }, {
        //        t:
        //        dt:
        //      }]
        // ]
        this._allCars = [];

        // 道の個数
        let nRoads = this._roads.length;

        for (let i=0; i<nRoads; i++) {
            let cars = [];
            for (let j=0; j<carsPerRoad; j++) {
                // 乱数生成で道上での位置と変位を決める
                let t = this.genRand(0.0, 1.0);
                let dt = this.genRand(0.001, 0.005);
                if (this.genRand(-1, 1)<0) {
                    dt *= -1;   // 確率1/2で符号反転
                }
                cars.push({
                    t: t,
                    dt: dt
                });
            }
            this._allCars.push(cars);
        }
    }

    updateCars() {
        let nRoads = this._allCars.length;

        for (let i=0; i<nRoads; i++) {
            let cars = this._allCars[i];
            let nCars = cars.length;
            for (let j=0; j<nCars; j++) {
                let car = cars[j];
                let newt = car.t + car.dt;
                if (newt <= 0) {
                    car.t = 0;
                    car.dt = -car.dt;
                } else if (newt >= 1.0) {
                    car.t = 1.0;
                    car.dt = -car.dt;
                } else {
                    car.t = newt;
                }
            }
        }
    }

    renderCars(ctx) {
        ctx.fillStyle = '#a00040';
        let nRoads = this._allCars.length;

        for (let i=0; i<nRoads; i++) {
            let road = this._roads[i];
            let cars = this._allCars[i];
            for (let j=0; j<cars.length; j++) {
                let t = cars[j].t;
                let pt = road.interp(t);
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2, false);
                ctx.fill();
            }
        }
    }

    genRand(min, max) {
        return (Math.random()*(max-min))+min;
    }

    copyToCanvas(ctx) {
        // オフスクリーンキャンバスからctxへ転送
        ctx.drawImage(this._offScrCanvas, 0, 0);
    }
}

module.exports = Map;