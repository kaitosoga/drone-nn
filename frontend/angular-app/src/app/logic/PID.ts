export class PID{

    relu(el: number) {
        return Math.max(0, el)
    }

    sigmoid(el: number) {
        return 1/ (1 + Math.exp(-el))
    }
    
    compute(state: any) {
        let opt_vec = state["opt"]
        let vel_vec = state["vel"]
        let acc_vec = state["acc"]
        let a = state["ang"]
        let va = Math.tanh(state["ang_vel"])

        let limiter = this.relu(-vel_vec[1])
        let ya = this.sigmoid(opt_vec[1] - acc_vec[1])
        let yv = this.sigmoid(opt_vec[1] - vel_vec[1])
        let xa = Math.tanh(opt_vec[0] - acc_vec[0])
        let xv = Math.tanh(opt_vec[0] - vel_vec[0])

        // factors:
        let f0 = 1/2
        let f1 = 1/10
        let f2 = 1/5
        let f3 = 1/4.5
        let f4 = 0 // omitted
        let f5 = 1/35
    
        // thrusts
        let l = 1 - yv + ya*f0 - xv*f1 - xa*f2 + a*f3 + va*f4 - limiter*f5
        let r = 1 - yv + ya*f0 + xv*f1 + xa*f2 - a*f3 - va*f4 - limiter*f5
        
        return [l, r]
    
    
    }
}