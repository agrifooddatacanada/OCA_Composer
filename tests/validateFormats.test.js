test('delimeters-checks', async () => {

    const delimeters = [',', ';', '|']

    const example_1 = 'test_a,test_b,test_c'
    const example_2 = 'test_a;test_b;test_c'
    const example_3 =  'test_a|teest_b|test_c'

    // use the first delimeter
    const delimeter = delimeters[0]
    const result_1 = example_1.split(delimeter)
    const result_2 = example_2.split(delimeter)
    const result_3 = example_3.split(delimeter)

});