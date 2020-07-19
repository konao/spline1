// **************************************************
//  3次スプライン関数でn個の点をなめらかに結ぶ曲線を作る
//
//  2018/12/30 konao
// **************************************************

// -------------------------------------
//  Ax=b（Aは三重対角行列）をガウス消去法で解く
// -------------------------------------

// ================================================
// 三重対角行列
//
// 対角要素とその両側の要素以外はすべて0
// （A[i, i-1], A[i, i], A[i, i+1]にしか値がない行列）
// ================================================
class BandMat3 {
    constructor (nrow) {
        if (nrow > 0) {
            this._m = new Array(nrow);
            for (let i=0; i<nrow; i++) {
                this._m[i] = new Array(0.0, 0.0, 0.0);
            }
            this._n = nrow;
        } else {
            this._m = [];
            this._n = 0;
        }
    }

    // deep-cloneを行う
    clone() {
        let m2 = new BandMat3(this._n);
        for (let i=0; i<this._n; i++) {
            for (let j=-1; j<=1; j++) {
                m2.setVal(i, i+j, this.getVal(i, i+j));
            }
        }
        return m2;
    }

    // 次元数を返す
    getDim() {
        return this._n;
    }

    // i行、j列の値を得る
    // (0<=i, j<_n)
    //
    // 範囲オーバーの場合は0が返る
    getVal(irow, jcol) {
        if (irow < 0 || jcol < 0 || irow >= this._n || jcol >= this._n) {
            return 0;
        }

        let j = jcol - (irow-1);    // 正常範囲なら0<=j<=2になる
        if (j<0 || j>2) {
            // 3重対角要素の範囲外
            return 0;
        }

        return this._m[irow][j];
    }

    // i行、j列の値をセットする
    // (0<=i, j<_n)
    //
    // 範囲オーバーの場合は何もしない
    setVal(irow, jcol, value) {
        if (irow < 0 || jcol < 0 || irow >= this._n || jcol >= this._n) {
            return;
        }

        let j = jcol - (irow-1);    // 正常範囲なら0<=j<=2になる
        if (j<0 || j>2) {
            // 3重対角要素の範囲外
            return;
        }

        this._m[irow][j] = value;
    }

    // この行列にvを掛けたベクトルを返す
    mulVec(v) {
        let result = new Vec(this._n);
        for (let i=0; i<this._n; i++) {
            let y = 0.0;
            for (let j=-1; j<=1; j++) {
                y += this.getVal(i, i+j)*v.getVal(i+j);
            }
            result.setVal(i, y);
        }
        return result;
    }

    // @param bBandElemOnly {boolean} true=3重対角要素のみ表示
    // false=通常の行列として表示
    print(bBandElemOnly) {
        if (bBandElemOnly) {
            for (let i=0; i<this._n; i++) {
                let s='';
                for (let j=0; j<3; j++) {
                    s += this._m[i][j].toString();
                    if (j !== 2) {
                        s += ', ';
                    }
                }
                console.log(s);
                // debug
                // for (let j=0; j<3; j++) {
                //     let s = '( + i + ', ' + j + ')=' + this._m[i][j];
                //     console.log(s);
                // }
            }
        } else {
            for (let i=0; i<this._n; i++) {
                let s='';
                for (let j=0; j<this._n; j++) {
                    s += this.getVal(i, j).toString();
                    if (j !== this._n-1) {
                        s += ', ';
                    }
                }
                console.log(s);
            }
        }
    }
}

// ================================================
//  要素n個のベクトル
// ================================================
class Vec {
    constructor (n) {
        if (n > 0) {
            this._v = new Array(n);
            for (let i=0; i<n; i++) {
                this._v[i] = 0.0;
            }
            this._n = n;
        } else {
            this._v = [];
            this._n = 0;
        }
    }

    // deep-cloneを行う
    clone() {
        let v2 = new Vec(this._n);
        for (let i=0; i<this._n; i++) {
            v2.setVal(i, this.getVal(i));
        }
        return v2;
    }

    getDim() {
        return this._n;
    }
    
    // i番目の値を得る
    // (0<=i<_n)
    //
    // 範囲オーバーの場合は0が返る
    getVal(i) {
        if (i < 0 || i >= this._n) {
            return 0;
        }

        return this._v[i];
    }

    // i番目の値をセットする
    // (0<=i<_n)
    //
    // 範囲オーバーの場合は何もしない
    setVal(i, value) {
        if (i < 0 || i >= this._n) {
            return;
        }

        this._v[i] = value;
    }

    // ----------------------------------------------------------
    // ベクトルが一致するか？
    //
    // @param x {Vec} 比較対象ベクトル
    // @param eps {number} イプシロン値．指定しない場合はデフォルト値が使われる
    //
    // @return {Object} 比較結果. 以下の属性を持つ
    //
    // @prop status {boolean} 比較が行えたか？
    // true=比較成功
    // false=比較がそもそもできなかった（ベクトルの長さが一致しない等）
    //
    // @prop bSame {boolean} 一致したか？のフラグ．statusがtrueの場合のみ意味を持つ．
    // true=一致した, false=一致しなかった
    // ----------------------------------------------------------
    isEqual(x, eps) {
        eps = eps || 1e-10;

        if (this._n !== x.getDim()) {
            // エラー
            return {
                status: false,
                bSame: false
            }
        }

        for (let i=0; i<this._n; i++) {
            let v1 = this._v[i];
            let v2 = x.getVal(i);
            if (Math.abs(v1-v2) > eps) {
                // v1とv2は一致しなかった
                console.log('*** not equal ***');
                console.log('['+i+'] v1='+v1+', v2='+v2)
                return {
                    status: true,
                    bSame: false
                }
            }
        }

        // すべての要素が一致した
        return {
            status: true,
            bSame: true
        }
    }

    print() {
        let s='';
        for (let i=0; i<this._n; i++) {
            s += this.getVal(i).toString();
            if (i !== this._n-1) {
                s += ', ';
            }
        }
        console.log(s);
    }

    // ======================================
    //  テスト
    // ======================================

    test1() {
        let v1 = new Vec(4);
        v1.setVal(0, 0.1);
        v1.setVal(1, 12.345);
        v1.setVal(3, -9.87);
        console.log('v1');
        v1.print();

        let v2 = v1.clone();
        console.log('v2');
        v2.print();

        let v3 = v1.clone();
        v3.setVal(1, -12.345);
        console.log('v3');
        v3.print();

        console.log('isEqaul(v1, v2)='+v1.isEqual(v2).bSame);
        console.log('isEqaul(v1, v3)='+v1.isEqual(v3).bSame);
    }
}

// ----------------------------------------------------------
// 線形方程式Ax=bを解く
// （Aは三重対角行列）
//
// @param A {BandMat3}
// @param b {Vec}
//
// @return x {Vec} Ax=bの解．エラーの場合はnullが返る．
// ----------------------------------------------------------
function solve(A, b) {
    let debug = false;

    if (A.getDim() !== b.getDim()) {
        // 次元が合っていない
        return null;
    }

    // 最初にA, bのコピーを取る ---> A2, b2
    let A2 = A.clone();
    let b2 = b.clone();

    // 次元n
    let n = A.getDim();

    // 前進消去
    // A2を変形して上三角行列を作り、
    // Ax=bをA2*x=b2に変換する
    for (let i=1; i<n; i++) {
        let sweep, prevVal, newVal;

        // A2を掃き出す
        let c1 = A2.getVal(i-1, i-1);   // 係数1
        let c2 = -A2.getVal(i, i-1);    // 係数2
        for (let j=-1; j<=1; j++) {
            sweep = A2.getVal(i-1, i+j);
            prevVal = A2.getVal(i, i+j);
            newVal = prevVal*c1 + sweep*c2;
            A2.setVal(i, i+j, newVal);
        }

        // b2も変換
        sweep = b2.getVal(i-1);
        prevVal = b2.getVal(i);
        newVal = prevVal*c1 + sweep*c2;
        b2.setVal(i, newVal);
    }

    if (debug) {
        console.log('A');
        A.print();
        console.log('A2');
        A2.print();
    
        console.log('b');
        b.print();
        console.log('b2');
        b2.print();
    }

    // 後退代入
    // xを求める
    let x = new Vec(n);

    // x[n-1]をまず求める
    let ans = b2.getVal(n-1)/A2.getVal(n-1, n-1);
    x.setVal(n-1, ans);

    // 次にx[i-1]をx[i]から求める．これをx[0]まで繰り返す
    for (let i=n-2; i>=0; i--) {
        ans = (b2.getVal(i) - A2.getVal(i, i+1)*x.getVal(i+1))/A2.getVal(i, i);
        x.setVal(i, ans);
    }

    if (debug) {
        console.log('x');
        x.print();
    }

    return x;
}

function genRand(min, max) {
    return (Math.random()*(max-min))+min;
}

function genRandMat(n, max, min) {
    let m = new BandMat3(n);
    for (let i=0; i<n; i++) {
        for (let j=-1; j<=1; j++) {
            m.setVal(i, i+j, genRand(min, max));
        }
    }
    return m;
}

function genRandVec(n, max, min) {
    let v = new Vec(n);
    for (let i=0; i<n; i++) {
        v.setVal(i, genRand(min, max));
    }
    return v;
}

// ================================================
//  スプライン曲線
// ================================================
class Spline {
    constructor() {
        // メンバ変数初期化

        // _ptsは2次元の点{x, y}の配列
        this._pts = [];
    
        // 3次スプライン多項式の係数
        // x
        this._ax = 0.0; // 0次
        this._bx = 0.0; // 1次
        this._cx = 0.0; // 2次
        this._dx = 0.0; // 3次

        // y
        this._ay = 0.0; // 0次
        this._by = 0.0; // 1次
        this._cy = 0.0; // 2次
        this._dy = 0.0; // 3次
    }

    clear() {
        this._pts = [];
    }

    addPoint(x, y) {
        this._pts.push({
            x: x,
            y: y
        });
    }

    getPoint(i) {
        if (i<0 || i>=this._pts.length) {
            // 範囲オーバー
            return {};
        }

        return this._pts[i];
    }

    count() {
        return this._pts.length;
    }

    // ----------------------------------------------------------
    // スプライン曲線生成
    //
    // 基準点_ptsを元にスプライン曲線の係数を算出する．
    // x, yをそれぞれ媒介変数tの関数として補間する．
    // tの範囲は0<=t<1．
    // 0から1をN等分(Nは_ptsにセットされている点の個数)し、
    // N-1個の区間に分ける．
    // N-1個のそれぞれの区間に対して3次多項式の係数a, b, c, dを計算する．
    //
    // @return {boolean} true=成功, false=失敗
    // ----------------------------------------------------------
    genSpline() {
        let N = this._pts.length;   // 基準点の個数
        if (N < 2) {
            return false;
        }

        let h = 1/(N-1);

        // aを求める
        // 求めると言っても、aの値はX（またはY）と同じなので
        // 単にコピーするだけ
        let ax = new Vec(N);
        let ay = new Vec(N);
        for (let i=0; i<N; i++) {
            let pt = this._pts[i];
            ax.setVal(i, pt.x);
            ay.setVal(i, pt.y);
        }
        
        // Aを作る
        let A = new BandMat3(N);
        A.setVal(0, 0, 1);
        A.setVal(N-1, N-1, 1);
        for (let i=1; i<=N-2; i++) {
            A.setVal(i, i-1, h);
            A.setVal(i, i, 4*h);
            A.setVal(i, i+1, h);
        }

        // b0を作る
        let b0 = new Vec(N);
        b0.setVal(0, 0);
        b0.setVal(N-1, 0);
        for (let i=1; i<=N-2; i++) {
            let x0 = this._pts[i-1].x;
            let x1 = this._pts[i].x;
            let x2 = this._pts[i+1].x;
            b0.setVal(i, 3/h*(x2-x1)-3/h*(x1-x0));
        }
    
        // b1を作る
        let b1 = new Vec(N);
        b1.setVal(0, 0);
        b1.setVal(N-1, 0);
        for (let i=1; i<=N-2; i++) {
            let y0 = this._pts[i-1].y;
            let y1 = this._pts[i].y;
            let y2 = this._pts[i+1].y;
            b1.setVal(i, 3/h*(y2-y1)-3/h*(y1-y0));
        }

        // cx, cyを求める
        // (cxはA*cx=b0、cyはA*cy=b1の解)
        let cx = solve(A, b0);
        let cy = solve(A, b1);

        // dをcとhから求める
        let dx = new Vec(N);
        let dy = new Vec(N);
        for (let i=0; i<N-1; i++) {
            dx.setVal(i, (cx.getVal(i+1)-cx.getVal(i))/(3*h));
            dy.setVal(i, (cy.getVal(i+1)-cy.getVal(i))/(3*h));
        }

        // bをa, c, hから求める
        let bx = new Vec(N);
        let by = new Vec(N);
        for (let i=0; i<N-1; i++) {
            bx.setVal(i, (ax.getVal(i+1)-ax.getVal(i))/h - h*(cx.getVal(i+1)+2*cx.getVal(i))/3);
            by.setVal(i, (ay.getVal(i+1)-ay.getVal(i))/h - h*(cy.getVal(i+1)+2*cy.getVal(i))/3);
        }

        // メンバ変数に求まった3次式の係数を格納
        this._ax = ax;
        this._bx = bx;
        this._cx = cx;
        this._dx = dx;

        this._ay = ay;
        this._by = by;
        this._cy = cy;
        this._dy = dy;

        return true;    // 成功
    }

    // tに対する点を求める
    //
    // @param t {number} 補間パラメータ(0<=t<1)
    // t<0のときはt=0, t>=1のときはt=1として計算する．
    //
    // @return {Point2d} tに対する点
    // エラー発生時はnullが返る
    interp(t) {
        let N = this._pts.length;   // 基準点の個数
        if (N < 2) {
            return null;
        }

        if (t<0) {
            t=0;
        } else if (t>=1) {
            t=1;
        }

        let ind = Math.floor(t*(N-1));
        // console.log('t='+t+', ind='+ind);
        if (ind >= N) {
            console.log('index out of range. ind='+ind+', N='+N);
            return null;
        }

        let h = 1/(N-1);

        // ind番目の係数を取得
        let ax = this._ax.getVal(ind);
        let bx = this._bx.getVal(ind);
        let cx = this._cx.getVal(ind);
        let dx = this._dx.getVal(ind);

        let ay = this._ay.getVal(ind);
        let by = this._by.getVal(ind);
        let cy = this._cy.getVal(ind);
        let dy = this._dy.getVal(ind);

        // 補間計算
        let t0 = h*ind;
        let px = ax + bx*(t-t0) + cx*(t-t0)*(t-t0) + dx*(t-t0)*(t-t0)*(t-t0);
        let py = ay + by*(t-t0) + cy*(t-t0)*(t-t0) + dy*(t-t0)*(t-t0)*(t-t0);

        return {
            x: px,
            y: py
        };
    }

    test00() {
        this.addPoint(1, 1);
        this.addPoint(3, 4);
        this.addPoint(5, 7);
        this.genSpline();
        for (let t=0; t<=1.0; t+=0.1) {
            let pt = this.interp(t);
            console.log('t='+t+', x='+pt.x+', y='+pt.y);
        }
    }
}

// 複数個のクラス、関数をエクスポートするときはこうする．
// 使う側はインポートの際に、destructuringすればよい．
// (ex)
// const { Spline, Vec } = require('./spline');
module.exports = {
    Vec,
    Spline
};

// ============================
//  テスト
// ============================

function test00() {
    let A1 = new BandMat3(5);
    A1.setVal(0, 0, 1.0);
    A1.setVal(1, 0, 1.0)
    A1.setVal(1, 1, 8.0);
    A1.setVal(1, 2, 3.0);
    A1.setVal(2, 1, 3.0)
    A1.setVal(2, 2, 8.0);
    A1.setVal(2, 3, 1.0);
    A1.setVal(3, 2, 1.0)
    A1.setVal(3, 3, 8.0);
    A1.setVal(3, 4, 3.0);
    A1.setVal(4, 4, 1.0);
    console.log('A1');
    A1.print(false);
    
    // let A2 = A1.clone();
    // console.log('A2');
    // A2.print(false);
    
    let b = new Vec(5);
    b.setVal(0, 0);
    b.setVal(1, -8);
    b.setVal(2, -10);
    b.setVal(3, 10);
    b.setVal(4, 0);
    console.log('b');
    b.print();
    
    solve(A1, b);

    let c = A1.mulVec(b);
    c.print();
}

let vv = new Vec();
vv.test1();

function test01() {
    let N=10;
    console.log('N='+N);
    for (let i=0; i<1000; i++) {
        let AA2 = genRandMat(N, -10, 10);
        // console.log('AA2');
        // AA2.print();
        
        let bb2 = genRandVec(N, -10, 10);
        // console.log('bb2');
        // bb2.print();
        
        let x2 = solve(AA2, bb2);
        // console.log('x2');
        // x2.print();
        
        let y2 = AA2.mulVec(x2);
        // console.log('y2');
        // y2.print();
        
        let success = y2.isEqual(bb2).bSame;
        console.log('['+i+'] isEqual(y2, bb2)='+success);
        if (!success) {
            console.log('wrong result detected!!');
            break;
        }
    }
}

function test10(ctx) {
    let sp = new Spline();

    sp.addPoint(10.0, 10.0);
    sp.addPoint(400.0, 50.0);
    sp.addPoint(600.0, 150.0);
    sp.addPoint(550.0, 300.0);
    sp.addPoint(300.0, 450.0);
    sp.addPoint(150.0, 350.0);
    sp.addPoint(200.0, 270.0);
    sp.addPoint(520.0, 400.0);
    sp.addPoint(580.0, 600.0);
    sp.addPoint(350.0, 750.0);
    sp.addPoint(120.0, 580.0);
    sp.addPoint(50.0, 650.0);
    sp.addPoint(150.0, 700.0);
    sp.addPoint(500.0, 500.0);
    sp.addPoint(700.0, 400.0);

    let status = sp.genSpline();
    console.log(status);

    ctx.fillStyle = '#105090';
    for (let t=0.0; t<1.0; t+=0.002) {
        let pt = sp.interp(t);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2, false);
        ctx.fill();
    }
}

// test10(ctx);
