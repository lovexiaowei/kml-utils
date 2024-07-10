import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser'
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'
export default {
    input: "./src/index.js",
    output: [
        {
            file: './dist/polyline.js',
            format: 'umd',
            name: 'KmlUtils'
            //当入口文件有export时，'umd'格式必须指定name
            //这样，在通过<script>标签引入时，才能通过name访问到export的内容。
        },
    ],
    external: [],
    plugins:[
        serve({
            host:'127.0.0.1',
            contentBase: '',  //服务器启动的文件夹，默认是项目根目录，需要在该文件下创建index.html
            port: 8025   //端口号，默认10001
        }),
        livereload('dist'),   //watch dist目录，当目录中的文件发生变化时，刷新页面
        // terser(),
        resolve(),
        commonjs(),
        babel({
            exclude: 'node_modules/**'
        })
    ]
}
