*store/info.js*

```js
  if (__DEV__) {
      this.goodsList = {}
      this.goodsList.goodsList = {
        financial_products: [
          {
            code: '123',
            terms: 5,
            interest_rate: 0,
          },
          {
            code: '124',
            terms: 8,
            interest_rate: 0.3,
          },
          {
            code: '125',
            terms: 20,
            interest_rate: 0.8,
          },
        ],
        service_tags: {
          function: [{
            id: 1,
            name: '成单礼，最高可返¥300',
          }],
          display: [
            {
              id: 3,
              name: '店 服务一',
              desc: '',
              icon_url: 'icon_url'
            },
            {
              id: 3,
              name: '店 服务二',
              desc: '',
              icon_url: 'icon_url'
            },
            {
              id: 3,
              name: '店 服务三',
              desc: '',
              icon_url: 'icon_url'
            },
            {
              id: 3,
              name: '店 服务四',
              desc: '',
              icon_url: 'icon_url'
            }
          ]
        },
        goods_list: [
          {
            id: 5,
            course_id: 123,
            name: '早教课程一',
            default_fee: 9000,
            notice: '购买须知购买须知购买须知购买须知购买须知购买须知购买须知购买须知',
            // notice:
            service_tags: {
              function: [{
                id: 678,
                name: '成单礼成单礼一一一'
              }],
              display: [{
                id: 789,
                name: 'display文',
                desc: 'display desc',
              }],
            },
            sku: [
              {
                id: 100,
                class_hour: 10,
                fee: 1000,
                fee_origin: 1100,
                fee_per_class: 100,
                mark: '显示标记描述',
                flags: [{
                  flag: 11,
                  // name: 'hot',
                  url: 'flag_url111',
                }]
              },
              {
                id: 101,
                class_hour: 20,
                fee: 1200,
                fee_origin: 1300,
                fee_per_class: 200,
                mark: '显示标记描述',
                flags: [{
                  flag: 12,
                  name: 'hot',
                  url: 'flag_url222',
                }]
              },
              {
                id: 102,
                class_hour: 30,
                fee: 1300,
                fee_origin: 1400,
                fee_per_class: 300,
                mark: '显示标记描述',
                flags: [{
                  flag: 13,
                  name: 'hot',
                  url: 'flag_url333',
                }]
              }
            ],
            router: {
              type: 'goods',
              param: {
                id: 345,
                sku: '001',
              }
            }
          },
          {
            id: 5,
            course_id: 123,
            name: '早教课程一',
            default_fee: 9000,
            notice: '购买须知购买须知购买须知购买须知购买须知购买须知购买须知购买须知',
            // notice:
            service_tags: {
              function: [{
                id: 678,
                name: '成单礼成单礼二二二'
              }],
              display: [
                {
                  id: 789,
                  name: 'display',
                  desc: 'display desc',
                }, {
                  id: 790,
                  name: 'display减',
                  desc: 'display desc',
                }, {
                  id: 791,
                  name: 'display礼',
                  desc: 'display desc',
                }
              ],
            },
            sku: [
              {
                id: 100,
                class_hour: 10,
                fee: 1000,
                fee_origin: 1100,
                fee_per_class: 100,
                mark: '显示标记描述',
                flags: []
              },
            ],
            router: {
              type: 'goods',
              param: {
                id: 5,
                sku: '100',
              }
            }
          },
          {
            id: 5,
            course_id: 123,
            name: '早教课程一',
            default_fee: 9000,
            notice: '购买须知购买须知购买须知购买须知购买须知购买须知购买须知购买须知',
            // notice:
            service_tags: {
              function: [],
              display: [],
            },
            sku: [
              {
                id: 100,
                class_hour: 10,
                fee: 1000,
                fee_origin: 1100,
                fee_per_class: 100,
                mark: '显示标记描述',
                flags: []
              },
            ],
            router: {
              type: 'goods',
              param: {
                id: 345,
                sku: '3',
              }
            }
          }
        ]
      }

      this.goodsList.getBooking = {
        // store_id: 123,
        status: 0, // 预定状态 1: booked, 0: nope
        can_buy: 0,
        desc: 'desc'
      }

      return (
        <Page init_data={this.storeInfo} goodsList={this.goodsList} />
      )
    }
```