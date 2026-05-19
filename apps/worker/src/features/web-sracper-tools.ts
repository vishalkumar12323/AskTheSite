interface IWebScarperData {
    url: string,
    websiteLogo: string;
    loginLink: string;
    signupLink: string;
    
}[]

class WebScarper {
    private url: string;
    public data: IWebScarperData[];
    constructor(url: string) {
        this.url = url;
        this.data = [];
        this.scrape(this.url);
    }

    private async scrape(url: string) {

    }

    getLoginLink() {
        return this.data[0].loginLink;
    }

    getSignupLink() {
        return this.data[0].signupLink;
    }
}

export {WebScarper};